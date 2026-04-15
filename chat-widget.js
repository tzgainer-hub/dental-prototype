(function () {
  // ── Styles ───────────────────────────────────────────────────────────────
  const css = `
    #ai-chat-btn {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 9999;
      background: #0891b2;
      color: white;
      border: none;
      border-radius: 50px;
      padding: 14px 22px;
      font-family: Inter, sans-serif;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 9px;
      box-shadow: 0 4px 20px rgba(8,145,178,0.45);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    #ai-chat-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(8,145,178,0.55);
    }
    #ai-chat-btn .chat-pulse {
      width: 9px; height: 9px;
      background: #4ade80;
      border-radius: 50%;
      animation: pulse 2s infinite;
      flex-shrink: 0;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.3); }
    }
    #ai-chat-modal {
      display: none;
      position: fixed;
      bottom: 90px;
      right: 28px;
      width: 380px;
      max-width: calc(100vw - 32px);
      height: 560px;
      max-height: calc(100vh - 120px);
      z-index: 9998;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.18);
      flex-direction: column;
      overflow: hidden;
      font-family: Inter, sans-serif;
    }
    #ai-chat-modal.open { display: flex; }
    .chat-header {
      background: #0891b2;
      color: white;
      padding: 18px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }
    .chat-header-icon {
      width: 40px; height: 40px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .chat-header-text .chat-title {
      font-weight: 700;
      font-size: 15px;
      margin: 0 0 2px 0;
    }
    .chat-header-text .chat-subtitle {
      font-size: 12px;
      opacity: 0.85;
      margin: 0;
    }
    .chat-close {
      margin-left: auto;
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 4px;
      opacity: 0.8;
      transition: opacity 0.15s;
    }
    .chat-close:hover { opacity: 1; }
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #f8fafc;
    }
    .chat-bubble {
      max-width: 88%;
      padding: 11px 14px;
      border-radius: 14px;
      font-size: 14px;
      line-height: 1.55;
      color: #1e293b;
    }
    .chat-bubble.agent {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .chat-bubble.user {
      background: #0891b2;
      color: white;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .chat-bubble.status {
      background: #f0fdff;
      border: 1px dashed #a5f3fc;
      align-self: center;
      font-size: 12px;
      color: #0891b2;
      padding: 8px 14px;
    }
    .chat-typing {
      display: flex;
      gap: 5px;
      align-items: center;
      padding: 12px 14px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      border-bottom-left-radius: 4px;
      align-self: flex-start;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .chat-typing span {
      width: 7px; height: 7px;
      background: #94a3b8;
      border-radius: 50%;
      animation: typing 1.2s infinite;
    }
    .chat-typing span:nth-child(2) { animation-delay: 0.2s; }
    .chat-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes typing {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
      30% { transform: translateY(-5px); opacity: 1; }
    }
    .chat-email-notice {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 12px;
      color: #15803d;
      align-self: center;
      text-align: center;
      max-width: 90%;
    }
    .chat-input-area {
      padding: 12px 14px;
      background: #ffffff;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }
    #chat-input {
      flex: 1;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 13px;
      font-size: 14px;
      font-family: Inter, sans-serif;
      outline: none;
      color: #1e293b;
      resize: none;
      transition: border-color 0.15s;
    }
    #chat-input:focus { border-color: #0891b2; }
    #chat-input:disabled { background: #f8fafc; color: #94a3b8; }
    #chat-send {
      background: #0891b2;
      color: white;
      border: none;
      border-radius: 10px;
      width: 40px;
      height: 40px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.15s;
      align-self: flex-end;
    }
    #chat-send:hover { background: #0e7490; }
    #chat-send:disabled { background: #cbd5e1; cursor: default; }
    @media (max-width: 480px) {
      #ai-chat-modal { bottom: 0; right: 0; width: 100%; max-width: 100%; border-radius: 16px 16px 0 0; height: 70vh; }
      #ai-chat-btn { bottom: 80px; right: 16px; }
    }
  `;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ── HTML ─────────────────────────────────────────────────────────────────
  document.body.insertAdjacentHTML('beforeend', `
    <button id="ai-chat-btn" onclick="window.aiChat.toggle()">
      <span class="chat-pulse"></span>
      Schedule a Visit
    </button>

    <div id="ai-chat-modal">
      <div class="chat-header">
        <div class="chat-header-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div class="chat-header-text">
          <p class="chat-title">Book Your Appointment</p>
          <p class="chat-subtitle">Hi! I'm Sarah, your virtual assistant — here to help</p>
        </div>
        <button class="chat-close" onclick="window.aiChat.toggle()" aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="chat-messages" id="chat-messages"></div>
      <div class="chat-input-area">
        <input type="text" id="chat-input" placeholder="Type your message..." disabled />
        <button id="chat-send" disabled onclick="window.aiChat.sendMessage()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  `);

  // ── State ─────────────────────────────────────────────────────────────────
  let sessionId = null;
  const transcript = []; // { role, text }

  const modal = document.getElementById('ai-chat-modal');
  const messages = document.getElementById('chat-messages');
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');

  // ── Helpers ───────────────────────────────────────────────────────────────
  function addBubble(text, role) {
    const div = document.createElement('div');
    div.className = `chat-bubble ${role}`;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    if (role === 'agent' || role === 'user') {
      transcript.push({ role, text });
    }
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'chat-typing';
    el.id = 'chat-typing-indicator';
    el.innerHTML = '<span></span><span></span><span></span>';
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
  }

  function hideTyping() {
    const el = document.getElementById('chat-typing-indicator');
    if (el) el.remove();
  }

  function setInputEnabled(enabled) {
    input.disabled = !enabled;
    sendBtn.disabled = !enabled;
    if (enabled) input.focus();
  }

  function showEmailNotice() {
    const div = document.createElement('div');
    div.className = 'chat-email-notice';
    div.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:5px"><polyline points="20 6 9 17 4 12"/></svg>
      Summary sent to the front desk — they'll call you within one business day
      <br><br>
      <button onclick="window.aiChat.saveTranscript()" style="background:#0891b2;color:white;border:none;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:Inter,sans-serif;margin-top:4px;">
        &#8681; Save My Transcript
      </button>
    `;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  // ── Session start ─────────────────────────────────────────────────────────
  function startSession() {
    showTyping();

    fetch('/api/chat/start', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      .then(r => r.json())
      .then(data => {
        hideTyping();
        if (data.error) throw new Error(data.error);
        sessionId = data.sessionId;
        addBubble(data.message, 'agent');
        setInputEnabled(true);
      })
      .catch(err => {
        hideTyping();
        addBubble('Sorry, I could not connect right now. Please call us at (480) 922-9933.', 'status');
        console.error(err);
      });
  }

  // ── Send message ──────────────────────────────────────────────────────────
  window.aiChat = {
    toggle: function () {
      const isOpen = modal.classList.contains('open');
      if (isOpen) {
        modal.classList.remove('open');
      } else {
        modal.classList.add('open');
        if (!sessionId) startSession();
      }
    },

    saveTranscript: function () {
      const lines = transcript.map(m => {
        const label = m.role === 'agent' ? 'Sarah (Scottsdale Surgical Arts)' : 'You';
        return `${label}:\n${m.text}`;
      });
      const content = [
        'Scottsdale Surgical Arts — Appointment Intake Transcript',
        `Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
        '─'.repeat(50),
        '',
        lines.join('\n\n'),
        '',
        '─'.repeat(50),
        'Scottsdale: (480) 922-9933  |  dental-prototype-production.up.railway.app'
      ].join('\n');

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'SSA-Intake-Transcript.txt';
      a.click();
      URL.revokeObjectURL(url);
    },

    sendMessage: function () {
      const text = input.value.trim();
      if (!text || !sessionId) return;

      addBubble(text, 'user');
      input.value = '';
      setInputEnabled(false);
      showTyping();

      fetch(`/api/chat/message/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      })
        .then(r => r.json())
        .then(data => {
          hideTyping();
          if (data.error) throw new Error(data.error);
          addBubble(data.message, 'agent');
          if (data.emailSent) showEmailNotice();
          setInputEnabled(true);
        })
        .catch(err => {
          hideTyping();
          addBubble('Something went wrong. Please try again or call (480) 922-9933.', 'status');
          setInputEnabled(true);
          console.error(err);
        });
    }
  };

  // Send on Enter key
  document.getElementById('chat-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      window.aiChat.sendMessage();
    }
  });
})();
