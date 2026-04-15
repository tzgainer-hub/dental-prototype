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

async function getAvailableSlots(preferenceDays, preferenceTime) {
  // Search week by week until we have 4 matching slots, up to 6 weeks out
  const dayMap = { 'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6 };
  const preferredDayNums = (preferenceDays || []).map(d => dayMap[d.toLowerCase()]).filter(d => d !== undefined);

  const matchingSlots = [];
  const MAX_WEEKS = 6;

  for (let week = 0; week < MAX_WEEKS && matchingSlots.length < 4; week++) {
    const start = new Date();
    start.setDate(start.getDate() + 1 + (week * 7));
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

  // Return up to 4 slots
  return slots.slice(0, 4).map(s => {
    const dt = new Date(s.start_time);
    return {
      iso: s.start_time,
      display: dt.toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/Phoenix',
        hour12: true
      })
    };
  });
}

function buildCalendlyLink(name, email) {
  const params = new URLSearchParams({
    name: name || '',
    email: email || ''
  });
  return `${CALENDLY_SCHEDULING_URL}?${params.toString()}`;
}

// ── Email helper ──────────────────────────────────────────────────────────────

async function sendIntakeEmail(summaryText) {
  if (!process.env.GMAIL_APP_PASSWORD) {
    console.log('No email credentials set — skipping email');
    return;
  }
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER || 'tzgainer@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
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

    // Check if Sarah wants to fetch slots
    if (assistantText.includes('[FETCH_SLOTS]') && !session.slotsShown && CALENDLY_TOKEN) {
      session.slotsShown = true;
      assistantText = assistantText.replace('[FETCH_SLOTS]', '').trim();

      // Parse preferences from conversation
      const convoText = session.messages.map(m => m.content).join(' ').toLowerCase();
      const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
        .filter(d => convoText.includes(d));
      const preferenceTime = convoText.includes('afternoon') ? 'afternoon'
        : convoText.includes('morning') ? 'morning' : null;

      try {
        const slots = await getAvailableSlots(days, preferenceTime);
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
      sendIntakeEmail(assistantText).catch(console.error);
    }

    res.json({ message: assistantText, emailSent, bookingLink });
  } catch (err) {
    console.error('Message error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/contact — existing patient appointment request form
app.post('/api/contact', async (req, res) => {
  const { fname, lname, phone, email, service, date, location, message } = req.body;
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
        subject: `Appointment Request — ${fname} ${lname}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#0891b2;color:white;padding:24px;border-radius:8px 8px 0 0;">
              <h2 style="margin:0;font-size:20px;">Appointment Request</h2>
              <p style="margin:6px 0 0;opacity:0.85;font-size:14px;">Submitted via Scottsdale Surgical Arts website</p>
            </div>
            <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;background:#fff;">
              <table style="width:100%;font-size:14px;line-height:2;color:#1e293b;">
                <tr><td style="color:#64748b;width:140px;">Name</td><td><strong>${fname} ${lname}</strong></td></tr>
                <tr><td style="color:#64748b;">Phone</td><td>${phone}</td></tr>
                <tr><td style="color:#64748b;">Email</td><td>${email}</td></tr>
                <tr><td style="color:#64748b;">Service</td><td>${service || 'Not specified'}</td></tr>
                <tr><td style="color:#64748b;">Preferred Date</td><td>${date || 'Not specified'}</td></tr>
                <tr><td style="color:#64748b;">Location</td><td>${location}</td></tr>
                <tr><td style="color:#64748b;">Notes</td><td>${message || 'None'}</td></tr>
              </table>
            </div>
            <p style="color:#94a3b8;font-size:12px;margin-top:12px;text-align:center;">Powered by Point Zero AI · pointzeroai.com</p>
          </div>
        `
      });
    }
    console.log(`Appointment request from ${fname} ${lname} (${email})`);
    res.json({ success: true });
  } catch (err) {
    console.error('Contact form error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => console.log(`Dental prototype running on port ${PORT}`));
