const express = require('express');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3456;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const AGENT_ID = process.env.DENTAL_AGENT_ID || 'agent_011Ca5gHhDynKtP7qtKJUnkA';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

// Active sessions: sessionId -> { started: bool }
const sessions = new Map();

// POST /api/chat/start — create session
app.post('/api/chat/start', async (req, res) => {
  try {
    const env = await client.beta.environments.create({ name: 'dental-intake-env' });
    const session = await client.beta.sessions.create({
      agent: AGENT_ID,
      environment_id: env.id
    });
    sessions.set(session.id, { started: false });
    res.json({ sessionId: session.id });
  } catch (err) {
    console.error('Start session error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chat/stream/:sessionId — SSE event stream
app.get('/api/chat/stream/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const send = (data) => {
    if (!res.destroyed) res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  req.on('close', () => console.log('Client disconnected:', sessionId));

  try {
    const sessionData = sessions.get(sessionId);

    if (!sessionData?.started) {
      send({ type: 'status', text: 'Connecting to AI assistant...' });
      await sleep(6000); // Give container time to spin up

      await client.beta.sessions.events.send(sessionId, {
        events: [{
          type: 'user.message',
          content: [{ type: 'text', text: "Hello, I'd like to schedule an appointment as a new patient." }]
        }]
      });
      sessions.set(sessionId, { started: true });
    }

    const stream = client.beta.sessions.events.stream(sessionId);

    for await (const event of stream) {
      if (req.destroyed) break;

      if (event.type === 'agent.message') {
        let text = '';
        for (const block of event.content) {
          if (block.text) text += block.text;
        }
        send({ type: 'message', text });

        if (text.includes('New Patient Intake Summary') || text.includes('intake summary')) {
          sendIntakeEmail(text).catch(console.error);
          send({ type: 'email_sent' });
        }
      } else if (event.type === 'session.status_idle') {
        send({ type: 'idle' });
      } else if (event.type === 'session.status_running') {
        send({ type: 'running' });
      } else if (event.type === 'session.status_terminated') {
        send({ type: 'terminated' });
        break;
      }
    }
  } catch (err) {
    console.error('Stream error:', err.message);
    send({ type: 'error', message: 'Connection issue. Please refresh and try again.' });
  }

  res.end();
});

// POST /api/chat/message/:sessionId — send patient message
app.post('/api/chat/message/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const { message } = req.body;

  if (!message?.trim()) return res.status(400).json({ error: 'Message cannot be empty' });

  try {
    await client.beta.sessions.events.send(sessionId, {
      events: [{
        type: 'user.message',
        content: [{ type: 'text', text: message.trim() }]
      }]
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Send message error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => console.log(`Dental prototype running on port ${PORT}`));
