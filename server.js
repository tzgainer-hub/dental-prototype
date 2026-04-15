const express = require('express');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3456;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Sarah, the friendly virtual receptionist for Scottsdale Surgical Arts, an oral and maxillofacial surgery practice in Scottsdale and Sedona, Arizona.

Your job is to warmly welcome new patients, collect the information needed to schedule their first visit, and make them feel at ease. Dental anxiety is very common — always be calm, warm, and reassuring.

You need to collect:
1. Patient's full name
2. Date of birth
3. Phone number
4. Email address
5. Reason for visit (e.g., implants, wisdom teeth, jaw surgery, consultation, emergency)
6. Whether they've been referred by a doctor or found us on their own
7. Insurance provider (or if they're self-pay)
8. Preferred appointment days/times (morning, afternoon, weekday, weekend)
9. Which location they prefer: Scottsdale (10603 N Hayden Rd) or Sedona (2935 Southwest Dr)
10. Any questions or concerns they want the doctor to know about

Guidelines:
- Start with a warm greeting and ask what brings them in today
- Ask one or two questions at a time — don't overwhelm them with a form-like list
- If they express anxiety or fear, acknowledge it warmly before moving on
- Be conversational, not robotic
- Once you have all the information, tell them the team will call to confirm their appointment within one business day
- End by producing a clean summary titled "New Patient Intake Summary" with all collected info formatted clearly for the front desk

Do not make up appointment times or confirm specific slots — you are collecting their preferences, not booking a specific time.`;

// Active sessions: sessionId -> { messages: [], summaryEmailed: bool }
const sessions = new Map();

function makeSessionId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

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

// POST /api/chat/start — create session, get Sarah's opening message
app.post('/api/chat/start', async (req, res) => {
  try {
    const sessionId = makeSessionId();
    sessions.set(sessionId, { messages: [], summaryEmailed: false });

    // Get Sarah's opening message
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: 'Hello, I found your website and I\'m interested in becoming a new patient.' }
      ]
    });

    const assistantText = response.content[0].text;

    // Store the exchange in session history
    sessions.get(sessionId).messages.push(
      { role: 'user', content: 'Hello, I found your website and I\'m interested in becoming a new patient.' },
      { role: 'assistant', content: assistantText }
    );

    res.json({ sessionId, message: assistantText });
  } catch (err) {
    console.error('Start session error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chat/message/:sessionId — send patient message, get Sarah's reply
app.post('/api/chat/message/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const { message } = req.body;

  if (!message?.trim()) return res.status(400).json({ error: 'Message cannot be empty' });

  const session = sessions.get(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  session.messages.push({ role: 'user', content: message.trim() });

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: session.messages
    });

    const assistantText = response.content[0].text;
    session.messages.push({ role: 'assistant', content: assistantText });

    // Check if summary is ready and email it
    if (
      !session.summaryEmailed &&
      (assistantText.includes('New Patient Intake Summary') || assistantText.includes('intake summary'))
    ) {
      session.summaryEmailed = true;
      sendIntakeEmail(assistantText).catch(console.error);
      return res.json({ message: assistantText, emailSent: true });
    }

    res.json({ message: assistantText });
  } catch (err) {
    console.error('Message error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => console.log(`Dental prototype running on port ${PORT}`));
