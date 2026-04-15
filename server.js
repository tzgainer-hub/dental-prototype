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
  // Fetch next 14 days of availability
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 14);

  const startStr = start.toISOString().replace('.000', '');
  const endStr = end.toISOString().replace('.000', '');

  const data = await calendlyGet(
    `/event_type_available_times?event_type=${encodeURIComponent(CALENDLY_EVENT_TYPE_URI)}&start_time=${startStr}&end_time=${endStr}`
  );

  let slots = data.collection || [];

  // Filter by patient preference
  if (preferenceDays && preferenceDays.length > 0) {
    const dayMap = { 'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6 };
    const preferredDayNums = preferenceDays.map(d => dayMap[d.toLowerCase()]).filter(d => d !== undefined);
    if (preferredDayNums.length > 0) {
      const filtered = slots.filter(s => {
        const day = new Date(s.start_time).getDay();
        return preferredDayNums.includes(day);
      });
      if (filtered.length > 0) slots = filtered;
    }
  }

  if (preferenceTime === 'morning') {
    const filtered = slots.filter(s => {
      const hour = new Date(s.start_time).getHours();
      return hour < 12;
    });
    if (filtered.length > 0) slots = filtered;
  } else if (preferenceTime === 'afternoon') {
    const filtered = slots.filter(s => {
      const hour = new Date(s.start_time).getHours();
      return hour >= 12;
    });
    if (filtered.length > 0) slots = filtered;
  }

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

Your job is to warmly welcome new patients, collect the information needed to schedule their first visit, and make them feel at ease. Dental anxiety is very common — always be calm, warm, and reassuring.

You need to collect:
1. Patient's full name
2. Date of birth
3. Phone number
4. Email address
5. Reason for visit (e.g., implants, wisdom teeth, jaw surgery, consultation, emergency)
6. Whether they've been referred by a doctor or found the practice on their own
7. Insurance provider (or if they're self-pay)
8. Preferred appointment days (e.g., Monday, Tuesday, weekdays, weekends)
9. Preferred time of day (morning or afternoon)
10. Which location they prefer: Scottsdale (10603 N Hayden Rd) or Sedona (2935 Southwest Dr)
11. Any questions or concerns they want the doctor to know about

Guidelines:
- Start with a warm greeting and ask what brings them in today
- Ask one or two questions at a time — don't overwhelm them with a form-like list
- If they express anxiety or fear, acknowledge it warmly before moving on
- Be conversational, not robotic
- Once you have collected their name, email, scheduling day preference, and time preference, include this EXACT marker on its own line so the system can fetch real availability: [FETCH_SLOTS]
- After the system provides available slots, present them naturally: "Let me check our calendar... I have a few openings that match your preferences:" then list them
- When the patient selects a slot, confirm it warmly
- After confirming the slot, produce a clean summary titled "New Patient Intake Summary" with all collected info
- Do not make up appointment times — only offer slots provided by the system

Do not make up appointment times or confirm specific slots unless the system has provided them.`;

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
          const slotList = slots.map((s, i) => `${i + 1}. ${s.display}`).join('\n');

          // Feed slots back to Sarah so she presents them naturally
          session.messages.push({ role: 'user', content: `[SYSTEM: Real available slots from our calendar:\n${slotList}\n\nPlease present these to the patient naturally and ask which they prefer.]` });

          const slotResponse = await client.messages.create({
            model: 'claude-opus-4-5',
            max_tokens: 512,
            system: SYSTEM_PROMPT,
            messages: session.messages
          });

          assistantText = slotResponse.content[0].text;
          session.messages.push({ role: 'assistant', content: assistantText });
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

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => console.log(`Dental prototype running on port ${PORT}`));
