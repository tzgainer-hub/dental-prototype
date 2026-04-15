const express = require('express');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const nodemailer = require('nodemailer');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3456;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Calendly config
const CALENDLY_TOKEN = process.env.CALENDLY_API_TOKEN;
const CALENDLY_EVENT_TYPE_URI = 'https://api.calendly.com/event_types/740bfb87-61f2-4851-8e9a-7f5cb41f9f03';
const CALENDLY_SCHEDULING_URL = 'https://calendly.com/tomz-pointzeroai/30min';

// ── Calendly helpers ──────────────────────────────────────────────────────────

function calendlyGet(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.calendly.com',
      path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CALENDLY_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function parseWeekOffset(messages) {
  // Look at the last few patient messages for timing hints
  const recentText = messages.slice(-4)
    .filter(m => m.role === 'user')
    .map(m => m.content).join(' ').toLowerCase();

  const threeWeeks = /3\s*weeks?\s*out|three\s*weeks?\s*out/;
  const fourWeeks  = /4\s*weeks?\s*out|four\s*weeks?\s*out/;
  const twoWeeks   = /2\s*weeks?\s*out|two\s*weeks?\s*out/;
  const nextMonth  = /next\s*month/;
  const endOfMonth = /end\s*of\s*(the\s*)?month/;
  const later      = /\b(later|further out|not so soon|not right away|further ahead)\b/;

  if (fourWeeks.test(recentText)) return 4;
  if (threeWeeks.test(recentText)) return 3;
  if (nextMonth.test(recentText) || endOfMonth.test(recentText)) return 3;
  if (twoWeeks.test(recentText)) return 2;
  if (later.test(recentText)) return 2;
  return 0;
}

async function getAvailableSlots(preferenceDays, preferenceTime, startWeekOffset = 0) {
  // Search week by week until we have 4 matching slots, up to 6 weeks out
  const dayMap = { 'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6 };
  const preferredDayNums = (preferenceDays || []).map(d => dayMap[d.toLowerCase()]).filter(d => d !== undefined);

  const matchingSlots = [];
  const MAX_WEEKS = 6;

  for (let week = 0; week < MAX_WEEKS && matchingSlots.length < 4; week++) {
    const start = new Date();
    start.setDate(start.getDate() + 1 + ((week + startWeekOffset) * 7));
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 0);

    const startStr = start.toISOString().split('.')[0] + 'Z';
    const endStr = end.toISOString().split('.')[0] + 'Z';

    const data = await calendlyGet(
      `/event_type_available_times?event_type=${encodeURIComponent(CALENDLY_EVENT_TYPE_URI)}&start_time=${startStr}&end_time=${endStr}`
    );

    let weekSlots = data.collection || [];
    console.log(`Week ${week + 1}: ${weekSlots.length} raw slots (${startStr})`);

    // Filter by preferred days
    if (preferredDayNums.length > 0) {
      weekSlots = weekSlots.filter(s => preferredDayNums.includes(new Date(s.start_time).getDay()));
    }

    // Filter by time of day (Arizona = UTC-7)
    if (preferenceTime === 'morning') {
      weekSlots = weekSlots.filter(s => (new Date(s.start_time).getUTCHours() - 7 + 24) % 24 < 12);
    } else if (preferenceTime === 'afternoon') {
      weekSlots = weekSlots.filter(s => (new Date(s.start_time).getUTCHours() - 7 + 24) % 24 >= 12);
    }

    matchingSlots.push(...weekSlots);
  }

  let slots = matchingSlots;

  // Pick one slot per calendar day, spread across 4 different days
  const seenDates = new Set();
  const spread = [];
  for (const s of slots) {
    const dateKey = new Date(s.start_time).toLocaleDateString('en-US', { timeZone: 'America/Phoenix' });
    if (!seenDates.has(dateKey)) {
      seenDates.add(dateKey);
      spread.push(s);
    }
    if (spread.length === 4) break;
  }

  return spread.map(s => ({
    iso: s.start_time,
    display: new Date(s.start_time).toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Phoenix',
      hour12: true
    })
  }));
}

function buildCalendlyLink(name, email) {
  const params = new URLSearchParams({
    name: name || '',
    email: email || ''
  });
  return `${CALENDLY_SCHEDULING_URL}?${params.toString()}`;
}

// ── Email helper ──────────────────────────────────────────────────────────────

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER || 'tzgainer@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
}

async function sendIntakeEmail(summaryText) {
  if (!process.env.GMAIL_APP_PASSWORD) {
    console.log('No email credentials set — skipping email');
    return;
  }
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"SSA Patient Intake" <${process.env.GMAIL_USER || 'tzgainer@gmail.com'}>`,
    to: 'tomz@pointzeroai.com',
    subject: `New Patient Intake — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0891b2;color:white;padding:24px;border-radius:8px 8px 0 0;">
          <h2 style="margin:0;font-size:20px;">New Patient Intake Received</h2>
          <p style="margin:6px 0 0;opacity:0.85;font-size:14px;">Submitted via Scottsdale Surgical Arts website</p>
        </div>
        <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;background:#ffffff;">
          <pre style="white-space:pre-wrap;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#1e293b;margin:0;">${summaryText.replace(/\*\*/g, '')}</pre>
        </div>
        <p style="color:#94a3b8;font-size:12px;margin-top:12px;text-align:center;">Powered by Point Zero AI · pointzeroai.com</p>
      </div>
    `
  });
  console.log('Intake email sent to tomz@pointzeroai.com');
}

async function sendPatientConfirmationEmail(patientEmail, patientName, summaryText, bookingLink) {
  if (!process.env.GMAIL_APP_PASSWORD || !patientEmail) return;

  const cleanSummary = summaryText
    .replace(/\*\*/g, '')
    .replace(/New Patient Intake Summary/gi, '')
    .replace(/---/g, '')
    .trim();

  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Scottsdale Surgical Arts" <${process.env.GMAIL_USER || 'tzgainer@gmail.com'}>`,
    to: patientEmail,
    subject: `Your Appointment Request — Scottsdale Surgical Arts`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0891b2;color:white;padding:28px 24px;border-radius:8px 8px 0 0;">
          <h2 style="margin:0;font-size:22px;">You're all set, ${patientName || 'there'}!</h2>
          <p style="margin:8px 0 0;opacity:0.9;font-size:15px;">Your request has been received by our team at Scottsdale Surgical Arts.</p>
        </div>
        <div style="padding:28px 24px;border:1px solid #e2e8f0;border-top:none;background:#ffffff;">

          <p style="font-size:15px;color:#1e293b;line-height:1.6;margin:0 0 20px;">Here's a copy of the information you provided. Please review it and let us know if anything needs to be corrected.</p>

          <div style="background:#f8fafc;border-radius:8px;padding:20px;font-size:14px;line-height:1.8;color:#1e293b;white-space:pre-wrap;">${cleanSummary}</div>

          ${bookingLink ? `
          <div style="text-align:center;margin:28px 0 8px;">
            <a href="${bookingLink}" style="display:inline-block;background:#f59e0b;color:white;text-decoration:none;border-radius:10px;padding:14px 32px;font-size:15px;font-weight:700;">
              Confirm Your Appointment Time →
            </a>
            <p style="color:#94a3b8;font-size:12px;margin-top:10px;">Click above to lock in your appointment on our calendar</p>
          </div>
          ` : ''}

          <div style="border-top:1px solid #e2e8f0;margin-top:24px;padding-top:20px;">
            <p style="font-size:14px;color:#64748b;margin:0 0 8px;"><strong>Scottsdale Office</strong><br>10603 N. Hayden Road, Suite H-112<br>Scottsdale, AZ 85260<br><a href="tel:4809229933" style="color:#0891b2;">(480) 922-9933</a></p>
            <p style="font-size:14px;color:#64748b;margin:16px 0 0;"><strong>Sedona Office</strong><br>2935 Southwest Drive, Suite 100<br>Sedona, AZ 86336<br><a href="tel:9282821224" style="color:#0891b2;">(928) 282-1224</a></p>
          </div>
        </div>
        <p style="color:#94a3b8;font-size:12px;margin-top:12px;text-align:center;">Scottsdale Surgical Arts · Oral &amp; Maxillofacial Surgery<br>Powered by Point Zero AI · pointzeroai.com</p>
      </div>
    `
  });
  console.log(`Patient confirmation email sent to ${patientEmail}`);
}

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Sarah, the friendly virtual receptionist for Scottsdale Surgical Arts, an oral and maxillofacial surgery practice in Scottsdale and Sedona, Arizona.

Your job is to warmly welcome new patients, get them booked fast, and make them feel at ease. Dental anxiety is very common — always be calm, warm, and reassuring.

## FAST-TRACK BOOKING (use this when patient wants to book)

If the patient says they want to book, schedule, or make an appointment, move quickly. You only need 4 things before checking the calendar:
1. Their full name
2. Their email address
3. Preferred days (e.g., Monday, Tuesday, weekdays, any day)
4. Preferred time of day (morning or afternoon)

Ask for these 2 at a time. Once you have all 4, write [FETCH_SLOTS] on its own line.

After the system provides real available slots, say something like:
"Great news — I just pulled up our calendar. Here are a few openings that match what you're looking for:" then list the slots clearly numbered.

When the patient picks a slot, confirm it warmly: "Perfect — I've got you down for [day/time]. Click the button below to lock it in — it only takes 30 seconds."

After they confirm, THEN collect the remaining details conversationally:
- Reason for visit / what procedure they need
- Phone number
- Date of birth
- Insurance provider (or self-pay)
- Which location: Scottsdale (10603 N Hayden Rd) or Sedona (2935 Southwest Dr)
- Any questions or concerns

End with a clean summary titled "New Patient Intake Summary" with everything collected.

## IF THEY HAVE QUESTIONS FIRST

Some patients want to ask about services, pricing, or whether they're in the right place before booking. Answer helpfully, then naturally guide them toward booking.

Note: Scottsdale Surgical Arts is a specialist practice (oral surgery). If someone needs a general dentist for cleanings/checkups, let them know kindly and offer to help if they ever need surgical care.

## RULES
- Ask 1-2 questions at a time, never a list
- Never make up appointment times — only use slots the system provides
- Do not make up [FETCH_SLOTS] results — wait for the system to inject them
- If the patient wants different timing ("3 weeks out", "later", "next month", "further ahead"), acknowledge it warmly and write [FETCH_SLOTS] again — the system will automatically shift the search window
- Be warm and human, not robotic or form-like`;

// ── Sessions ──────────────────────────────────────────────────────────────────

const sessions = new Map();

function makeSessionId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /api/chat/start
app.post('/api/chat/start', async (req, res) => {
  try {
    const sessionId = makeSessionId();
    sessions.set(sessionId, {
      messages: [],
      summaryEmailed: false,
      slotsShown: false,
      startWeekOffset: 0,
      patientName: null,
      patientEmail: null,
      availableSlots: []
    });

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: "Hello, I found your website and I'm interested in becoming a new patient." }
      ]
    });

    const assistantText = response.content[0].text;
    const session = sessions.get(sessionId);
    session.messages.push(
      { role: 'user', content: "Hello, I found your website and I'm interested in becoming a new patient." },
      { role: 'assistant', content: assistantText }
    );

    res.json({ sessionId, message: assistantText });
  } catch (err) {
    console.error('Start session error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chat/message/:sessionId
app.post('/api/chat/message/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const { message } = req.body;

  if (!message?.trim()) return res.status(400).json({ error: 'Message cannot be empty' });

  const session = sessions.get(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  session.messages.push({ role: 'user', content: message.trim() });

  // Extract name/email from conversation context for pre-filling Calendly link
  const fullConvo = session.messages.map(m => m.content).join(' ');
  const nameMatch = fullConvo.match(/(?:name is|I'm|I am|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  if (nameMatch && !session.patientName) session.patientName = nameMatch[1];

  const emailMatch = fullConvo.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
  if (emailMatch && !session.patientEmail) session.patientEmail = emailMatch[0];

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: session.messages
    });

    let assistantText = response.content[0].text;
    session.messages.push({ role: 'assistant', content: assistantText });

    // Check if Sarah wants to fetch slots (can fire multiple times)
    if (assistantText.includes('[FETCH_SLOTS]') && CALENDLY_TOKEN) {
      session.slotsShown = true;
      const weekOffset = parseWeekOffset(session.messages);
      assistantText = assistantText.replace('[FETCH_SLOTS]', '').trim();

      // Parse preferences from conversation
      const convoText = session.messages.map(m => m.content).join(' ').toLowerCase();
      const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
        .filter(d => convoText.includes(d));
      const preferenceTime = convoText.includes('afternoon') ? 'afternoon'
        : convoText.includes('morning') ? 'morning' : null;

      try {
        const slots = await getAvailableSlots(days, preferenceTime, weekOffset);
        session.availableSlots = slots;

        if (slots.length > 0) {
          session.availableSlots = slots;

          // Feed slots to Sarah so she introduces them — widget renders the actual buttons
          const slotList = slots.map((s, i) => `${i + 1}. ${s.display}`).join('\n');
          session.messages.push({ role: 'user', content: `[SYSTEM: Real available slots from our calendar:\n${slotList}\n\nTell the patient you pulled up the calendar and have a few openings. Do NOT list the times yourself — just say something warm like "I've got a few openings that match your preferences — pick the one that works best!" The times will be shown as buttons automatically.]` });

          const slotResponse = await client.messages.create({
            model: 'claude-opus-4-5',
            max_tokens: 256,
            system: SYSTEM_PROMPT,
            messages: session.messages
          });

          assistantText = slotResponse.content[0].text;
          session.messages.push({ role: 'assistant', content: assistantText });

          // Return slots to frontend for rendering as buttons
          return res.json({ message: assistantText, availableSlots: slots });
        } else {
          // No slots available — fall back gracefully
          session.messages.push({ role: 'user', content: '[SYSTEM: No online slots available right now. Please tell the patient the team will call to confirm within one business day.]' });

          const fallbackResponse = await client.messages.create({
            model: 'claude-opus-4-5',
            max_tokens: 512,
            system: SYSTEM_PROMPT,
            messages: session.messages
          });

          assistantText = fallbackResponse.content[0].text;
          session.messages.push({ role: 'assistant', content: assistantText });
        }
      } catch (calErr) {
        console.error('Calendly error:', calErr.message);
        // Non-fatal — just continue without slots
      }
    }

    // Check for selected slot — send Calendly booking link
    let bookingLink = null;
    if (session.availableSlots.length > 0) {
      const patientMsg = message.toLowerCase();
      let selectedSlot = null;

      session.availableSlots.forEach((slot, i) => {
        if (
          patientMsg.includes(`${i + 1}`) ||
          patientMsg.includes(slot.display.toLowerCase().split(' at ')[0].toLowerCase()) ||
          patientMsg.includes(slot.display.toLowerCase().split(',')[0].toLowerCase())
        ) {
          selectedSlot = slot;
        }
      });

      if (selectedSlot) {
        bookingLink = buildCalendlyLink(session.patientName, session.patientEmail);
        session.availableSlots = []; // clear so we don't keep triggering
      }
    }

    // Check if summary is ready — email it
    let emailSent = false;
    if (
      !session.summaryEmailed &&
      (assistantText.includes('New Patient Intake Summary') || assistantText.includes('intake summary'))
    ) {
      session.summaryEmailed = true;
      emailSent = true;
      const bookingLink = session.availableSlots?.length > 0
        ? buildCalendlyLink(session.patientName, session.patientEmail)
        : null;
      sendIntakeEmail(assistantText).catch(console.error);
      sendPatientConfirmationEmail(
        session.patientEmail,
        session.patientName,
        assistantText,
        bookingLink
      ).catch(console.error);
    }

    res.json({ message: assistantText, emailSent, bookingLink });
  } catch (err) {
    console.error('Message error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/contact — existing patient appointment request form
app.post('/api/contact', async (req, res) => {
  const { fname, lname, phone, email, message } = req.body;
  try {
    if (process.env.GMAIL_APP_PASSWORD) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER || 'tzgainer@gmail.com',
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });
      await transporter.sendMail({
        from: `"SSA Website" <${process.env.GMAIL_USER || 'tzgainer@gmail.com'}>`,
        to: 'tomz@pointzeroai.com',
        subject: `Patient Message — ${fname} ${lname}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#0891b2;color:white;padding:24px;border-radius:8px 8px 0 0;">
              <h2 style="margin:0;font-size:20px;">Message from Patient</h2>
              <p style="margin:6px 0 0;opacity:0.85;font-size:14px;">Submitted via Scottsdale Surgical Arts website</p>
            </div>
            <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;background:#fff;">
              <table style="width:100%;font-size:14px;line-height:2;color:#1e293b;">
                <tr><td style="color:#64748b;width:120px;">Name</td><td><strong>${fname} ${lname}</strong></td></tr>
                <tr><td style="color:#64748b;">Phone</td><td>${phone}</td></tr>
                <tr><td style="color:#64748b;">Email</td><td>${email}</td></tr>
              </table>
              <div style="margin-top:16px;padding:16px;background:#f8fafc;border-radius:8px;font-size:14px;line-height:1.7;color:#1e293b;">
                <strong style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Message</strong><br>
                ${message || 'No message provided'}
              </div>
            </div>
            <p style="color:#94a3b8;font-size:12px;margin-top:12px;text-align:center;">Powered by Point Zero AI · pointzeroai.com</p>
          </div>
        `
      });
    }
    console.log(`Patient message from ${fname} ${lname} (${email})`);
    res.json({ success: true });
  } catch (err) {
    console.error('Contact form error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/patient-forms — new patient health history & intake forms
app.post('/api/patient-forms', async (req, res) => {
  const d = req.body;
  const p = d.patient || {};
  const ec = d.emergencyContact || {};
  const ins1 = d.primaryInsurance || {};
  const ins2 = d.secondaryInsurance || {};
  const hh = d.healthHistory || {};
  const rec = d.recordsRelease || {};

  const patientName = `${p.firstName || ''} ${p.lastName || ''}`.trim();

  try {
    if (process.env.GMAIL_APP_PASSWORD) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER || 'tzgainer@gmail.com',
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });

      const row = (label, value) => value && value !== '—'
        ? `<tr><td style="color:#64748b;padding:4px 12px 4px 0;white-space:nowrap;font-size:13px;">${label}</td><td style="font-size:13px;color:#1e293b;">${value}</td></tr>`
        : '';

      const sectionHeader = (title) =>
        `<tr><td colspan="2" style="padding:20px 0 6px;"><strong style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#0891b2;">${title}</strong><hr style="border:none;border-top:1px solid #e2e8f0;margin:4px 0 0;"></td></tr>`;

      const tableRows = `
        ${sectionHeader('Patient — Personal Information')}
        ${row('Full Name', `${p.firstName} ${p.middleInitial ? p.middleInitial + '. ' : ''}${p.lastName}`)}
        ${row('Date of Birth', p.dob)}
        ${row('Gender', p.gender)}
        ${row('Marital Status', p.maritalStatus)}
        ${row('SSN (for claims)', p.ssn || 'Not provided')}
        ${row('Address', `${p.address}, ${p.city}, ${p.state} ${p.zip}`)}
        ${row('Mobile', p.mobile)}
        ${row('Home Phone', p.homePhone)}
        ${row('Work Phone', p.workPhone)}
        ${row('Email', p.email)}
        ${row('Employer', p.employer)}
        ${row('Referred By', p.referredBy)}
        ${row('Driver\'s License', p.driverLicense ? `${p.driverLicense} (${p.dlState})` : '')}
        ${p.guardian ? row('Guardian (minor)', `${p.guardian} — ${p.guardianRel}`) : ''}
        ${row('Nickname', p.nickname)}

        ${sectionHeader('Emergency Contact')}
        ${row('Name', ec.name)}
        ${row('Relationship', ec.relationship)}
        ${row('Phone', ec.phone)}

        ${sectionHeader('Primary Insurance')}
        ${row('Company', ins1.company)}
        ${row('Employer/Group', ins1.employer)}
        ${row('Group/Policy #', ins1.groupNumber)}
        ${row('Insurance Phone', ins1.phone)}
        ${row('Address', ins1.address ? `${ins1.address}, ${ins1.cityStateZip}` : '')}
        ${row('Subscriber Name', ins1.employeeName)}
        ${row('Subscriber DOB', ins1.employeeDob)}
        ${row('Member ID / SSN', ins1.memberId)}
        ${row('Patient Relationship', ins1.relationship)}

        ${d.hasSecondaryInsurance ? `
        ${sectionHeader('Secondary Insurance')}
        ${row('Company', ins2.company)}
        ${row('Employer/Group', ins2.employer)}
        ${row('Group/Policy #', ins2.groupNumber)}
        ${row('Insurance Phone', ins2.phone)}
        ${row('Subscriber Name', ins2.employeeName)}
        ${row('Subscriber DOB', ins2.employeeDob)}
        ${row('Member ID / SSN', ins2.memberId)}
        ${row('Patient Relationship', ins2.relationship)}
        ` : ''}

        ${sectionHeader('Dental & Medical History')}
        ${row('Reason for Visit', hh.reasonForVisit)}
        ${row('⚠ Requires Antibiotics', hh.requiresAntibiotics)}
        ${row('Currently in Pain', hh.currentlyInPain)}
        ${row('TMJ/Jaw Pain', hh.tmjPain)}
        ${row('Frequent Headaches', hh.frequentHeadaches)}
        ${row('Dental Health Rating', hh.dentalHealthRating)}
        ${row('Flosses Daily', hh.flossDaily)}
        ${row('Brushes Daily', hh.brushDaily)}
        ${row('Toothbrush Type', hh.toothbrushType)}
        ${row('Bristle Hardness', hh.bristleHardness)}
        ${row('Gums Bleed', hh.gumsBleed)}
        ${row('Periodontal Disease', hh.periodontaldisease)}
        ${row('Medical Conditions', hh.conditions)}
        ${row('Other Conditions', hh.conditionsOther)}
        ${row('Under Physician Care', hh.underPhysicianCare)}
        ${hh.underPhysicianCare === 'Yes' ? row('Physician', `${hh.physicianName} · ${hh.physicianPhone} · Last visit: ${hh.physicianLastVisit}`) : ''}
        ${row('Tobacco Use', hh.usesTobacco === 'Yes' ? `Yes — ${hh.tobaccoYears} years` : hh.usesTobacco)}
        ${hh.birthControl && hh.birthControl !== '—' ? row('Birth Control', hh.birthControl) : ''}
        ${hh.pregnant && hh.pregnant !== '—' ? row('Pregnant', hh.pregnant === 'Yes' ? `Yes — Week ${hh.pregnancyWeek}` : 'No') : ''}
        ${hh.nursing && hh.nursing !== '—' ? row('Nursing', hh.nursing) : ''}

        ${sectionHeader('Allergies')}
        <tr><td colspan="2" style="font-size:13px;color:#1e293b;white-space:pre-line;padding:4px 0;">${d.allergies || '—'}</td></tr>
        ${row('Other Allergies', d.allergyOther)}

        ${sectionHeader('Current Medications')}
        <tr><td colspan="2" style="font-size:13px;color:#1e293b;white-space:pre-line;padding:4px 0;">${d.medications || 'None reported'}</td></tr>

        ${sectionHeader('Payment & Consent')}
        ${row('Payment Method', d.payment)}
        ${row('Authorized Party 1', d.authorizedParties?.[0]?.name ? `${d.authorizedParties[0].name} (${d.authorizedParties[0].relationship})` : '')}
        ${row('Authorized Party 2', d.authorizedParties?.[1]?.name ? `${d.authorizedParties[1].name} (${d.authorizedParties[1].relationship})` : '')}

        ${rec.previousDentist ? `
        ${sectionHeader('Records Release Request')}
        ${row('Previous Dentist', rec.previousDentist)}
        ${row('Phone', rec.phone)}
        ${row('Fax/Email', rec.faxEmail)}
        ` : ''}

        ${sectionHeader('Electronic Signature')}
        ${row('Signed By', d.signature)}
        ${row('Date', d.signatureDate)}
      `;

      await transporter.sendMail({
        from: `"SSA New Patient Forms" <${process.env.GMAIL_USER || 'tzgainer@gmail.com'}>`,
        to: 'tomz@pointzeroai.com',
        subject: `New Patient Forms — ${patientName}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;">
            <div style="background:#0891b2;color:white;padding:28px 32px;border-radius:8px 8px 0 0;">
              <h2 style="margin:0;font-size:22px;">New Patient Forms Received</h2>
              <p style="margin:8px 0 0;opacity:0.85;font-size:14px;">Scottsdale Surgical Arts · Submitted ${d.signatureDate}</p>
            </div>
            ${hh.requiresAntibiotics === 'Yes' ? `
            <div style="background:#fffbeb;border:2px solid #f59e0b;padding:14px 20px;">
              <strong style="color:#92400e;">⚠ ANTIBIOTICS REQUIRED before treatment — see health history below</strong>
            </div>
            ` : ''}
            <div style="padding:28px 32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;background:#fff;">
              <table style="width:100%;border-collapse:collapse;">${tableRows}</table>
            </div>
            <p style="color:#94a3b8;font-size:12px;margin-top:12px;text-align:center;">Powered by Point Zero AI · pointzeroai.com</p>
          </div>
        `
      });

      // Confirmation email to patient
      if (p.email) {
        await transporter.sendMail({
          from: `"Scottsdale Surgical Arts" <${process.env.GMAIL_USER || 'tzgainer@gmail.com'}>`,
          to: p.email,
          subject: `Your Patient Forms — Scottsdale Surgical Arts`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
              <div style="background:#0c1a2e;color:white;padding:28px 32px;border-radius:8px 8px 0 0;">
                <h2 style="margin:0;font-size:20px;">Scottsdale Surgical Arts</h2>
                <p style="margin:6px 0 0;opacity:0.7;font-size:13px;">Oral &amp; Maxillofacial Surgery</p>
              </div>
              <div style="padding:28px 32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;background:#fff;">
                <p style="font-size:16px;color:#0c1a2e;margin:0 0 12px;"><strong>Thank you, ${p.firstName}!</strong></p>
                <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 20px;">
                  We've received your new patient forms. Our team will review everything before your appointment so we can hit the ground running when you arrive.<br><br>
                  If you haven't scheduled your appointment yet, you can do so online:
                </p>
                <div style="text-align:center;margin:24px 0;">
                  <a href="https://dental-prototype-production.up.railway.app/contact.html" style="background:#f59e0b;color:#fff;text-decoration:none;border-radius:8px;padding:14px 32px;font-weight:700;font-size:14px;display:inline-block;">Book My Appointment →</a>
                </div>
                <div style="background:#f8fafc;border-radius:8px;padding:16px 20px;font-size:13px;color:#374151;line-height:1.9;margin-top:20px;">
                  <strong>Scottsdale Office</strong><br>
                  10603 North Hayden Road, Suite H-112<br>
                  Scottsdale, AZ 85260<br>
                  <a href="tel:4809229933" style="color:#0891b2;">(480) 922-9933</a><br><br>
                  <strong>Sedona Office</strong><br>
                  2935 Southwest Drive, Suite 100<br>
                  Sedona, AZ 86336<br>
                  <a href="tel:9282821224" style="color:#0891b2;">(928) 282-1224</a>
                </div>
              </div>
              <p style="color:#94a3b8;font-size:12px;margin-top:12px;text-align:center;">Powered by Point Zero AI · pointzeroai.com</p>
            </div>
          `
        });
      }
    }

    console.log(`New patient forms submitted: ${patientName}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Patient forms error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => console.log(`Dental prototype running on port ${PORT}`));
