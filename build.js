#!/usr/bin/env node
/**
 * Point Zero AI — Dental Site Generator
 * Usage: node build.js config-template.json
 * Output: ./clients/{client_slug}/index.html
 */

const fs = require('fs');
const path = require('path');

const configPath = process.argv[2] || 'config-template.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// ── PALETTE DEFINITIONS ──────────────────────────────────────────────────────
const PALETTES = {
  'navy-teal': {
    navy: '#0f2240', navyLight: '#1a3560', accent: '#2a7d6f',
    accentLight: '#38a697', gold: '#c9a84c'
  },
  'warm': {
    navy: '#1a4a7a', navyLight: '#1e5a96', accent: '#e07b2a',
    accentLight: '#f09040', gold: '#e8b84b'
  },
  'luxury': {
    navy: '#1a1a2e', navyLight: '#2a2a4a', accent: '#c9a84c',
    accentLight: '#d4b86a', gold: '#c9a84c'
  },
  'fresh': {
    navy: '#1b6b45', navyLight: '#1f7a50', accent: '#2d9e6b',
    accentLight: '#48b480', gold: '#6db870'
  },
  'modern': {
    navy: '#4a1d96', navyLight: '#5b21b6', accent: '#7c3aed',
    accentLight: '#8b5cf6', gold: '#a78bfa'
  }
};

const pal = PALETTES[config.palette] || PALETTES['navy-teal'];

// ── TAWK.TO / CHAT WIDGET ────────────────────────────────────────────────────
const hasTawkto = !!(config.tawkto && config.tawkto.property_id && config.tawkto.widget_id);
const _phone = config.contact.phone_primary;
const _initials3 = config.practice.name.split(' ').map(w=>w[0]).join('').slice(0,3);

const chatCSS = hasTawkto ? '' : `
    #chat-bubble { position: fixed; bottom: 28px; left: 28px; width: 52px; height: 52px; background: var(--navy); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.25); transition: all 0.2s; z-index: 200; }
    #chat-bubble:hover { transform: scale(1.08); }
    .chat-badge { position: absolute; top: -2px; right: -2px; background: #e53e3e; color: #fff; font-size: 0.62rem; font-weight: 700; width: 17px; height: 17px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; }
    #chat-window { position: fixed; bottom: 92px; left: 28px; width: 310px; background: #fff; border-radius: 14px; box-shadow: 0 8px 40px rgba(0,0,0,0.16); z-index: 200; display: none; flex-direction: column; overflow: hidden; font-family: 'Inter', sans-serif; }
    #chat-window.open { display: flex; }
    .chat-header { background: var(--navy); color: #fff; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; }
    .chat-header-left { display: flex; gap: 10px; align-items: center; }
    .chat-avatar { width: 36px; height: 36px; background: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.62rem; font-weight: 700; }
    .chat-name { font-size: 0.85rem; font-weight: 600; }
    .chat-status { font-size: 0.7rem; color: rgba(255,255,255,0.6); display: flex; align-items: center; gap: 5px; margin-top: 2px; }
    .chat-dot { width: 6px; height: 6px; background: #48bb78; border-radius: 50%; display: inline-block; }
    .chat-close { background: none; border: none; color: rgba(255,255,255,0.6); font-size: 1rem; cursor: pointer; }
    .chat-body { padding: 14px; min-height: 130px; background: #f7f8fa; }
    .chat-msg-bubble { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px 10px 10px 0; padding: 9px 12px; font-size: 0.85rem; color: var(--text); display: inline-block; max-width: 90%; }
    .chat-msg-time { font-size: 0.66rem; color: var(--text-light); margin-top: 3px; padding-left: 3px; }
    .chat-quick-replies { display: flex; flex-direction: column; gap: 6px; margin-top: 9px; }
    .chat-quick-replies button { background: #fff; border: 1.5px solid var(--border); border-radius: 18px; padding: 7px 12px; font-size: 0.78rem; color: var(--navy); cursor: pointer; text-align: left; font-family: 'Inter', sans-serif; transition: all 0.15s; }
    .chat-quick-replies button:hover { border-color: var(--accent); color: var(--accent); }
    .chat-input-row { display: flex; border-top: 1px solid var(--border); background: #fff; }
    .chat-input-row input { flex: 1; border: none; padding: 11px 14px; font-size: 0.85rem; font-family: 'Inter', sans-serif; outline: none; }
    .chat-input-row button { background: var(--accent); border: none; color: #fff; padding: 0 14px; cursor: pointer; }
    .chat-footer { font-size: 0.66rem; color: var(--text-light); text-align: center; padding: 7px; background: #fff; border-top: 1px solid var(--border); }`;

const chatHTML = hasTawkto ? '' : `
  <div id="chat-bubble" onclick="toggleChat()">
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
    <span class="chat-badge">1</span>
  </div>
  <div id="chat-window">
    <div class="chat-header">
      <div class="chat-header-left">
        <div class="chat-avatar">${_initials3}</div>
        <div><div class="chat-name">${config.practice.name}</div><div class="chat-status"><span class="chat-dot"></span> We're online</div></div>
      </div>
      <button onclick="toggleChat()" class="chat-close" style="background:none;border:none;color:rgba(255,255,255,0.7);cursor:pointer;font-size:1rem;">✕</button>
    </div>
    <div class="chat-body">
      <div><div class="chat-msg-bubble">👋 Hi! How can we help you today?</div><div class="chat-msg-time">Just now</div></div>
      <div class="chat-quick-replies">
        <button onclick="quickReply('I\\'d like to book an appointment')">📅 Book an appointment</button>
        <button onclick="quickReply('I have a question about a procedure')">❓ Procedure question</button>
        <button onclick="quickReply('What insurance do you accept?')">🏥 Insurance questions</button>
      </div>
    </div>
    <div class="chat-input-row">
      <input type="text" id="chat-input" placeholder="Type a message..." onkeydown="if(event.key==='Enter')sendChat()" />
      <button onclick="sendChat()"><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg></button>
    </div>
    <div class="chat-footer">🔒 Secure · Typically reply within minutes</div>
  </div>`;

const chatScript = hasTawkto
  ? `<!--Start of Tawk.to Script-->
<script type="text/javascript">
var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
(function(){
var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
s1.async=true;
s1.src='https://embed.tawk.to/${config.tawkto.property_id}/${config.tawkto.widget_id}';
s1.charset='UTF-8';
s1.setAttribute('crossorigin','*');
s0.parentNode.insertBefore(s1,s0);
})();
</script><!--End of Tawk.to Script-->`
  : `<script>
    function toggleChat() {
      const w = document.getElementById('chat-window');
      const b = document.querySelector('.chat-badge');
      w.classList.toggle('open');
      if (w.classList.contains('open') && b) b.style.display = 'none';
    }
    function quickReply(text) { document.getElementById('chat-input').value = text; sendChat(); }
    function sendChat() {
      const input = document.getElementById('chat-input');
      const body = document.querySelector('.chat-body');
      const text = input.value.trim();
      if (!text) return;
      const userMsg = document.createElement('div');
      userMsg.style.cssText = 'text-align:right;margin:8px 0;';
      userMsg.innerHTML = '<div style="background:var(--accent);color:#fff;border-radius:10px 10px 0 10px;padding:8px 12px;font-size:.83rem;display:inline-block;max-width:90%;">' + text + '</div>';
      body.appendChild(userMsg);
      input.value = '';
      const qr = body.querySelector('.chat-quick-replies');
      if (qr) qr.remove();
      setTimeout(() => {
        const bot = document.createElement('div');
        bot.innerHTML = '<div class="chat-msg-bubble">Thanks! Someone from our team will follow up shortly. For urgent matters, call <strong>${_phone}</strong>.</div><div class="chat-msg-time">Just now</div>';
        body.appendChild(bot);
        body.scrollTop = body.scrollHeight;
      }, 700);
      body.scrollTop = body.scrollHeight;
    }
  </script>`;

// ── HELPERS ──────────────────────────────────────────────────────────────────
const doctorInitials = name => name.replace('Dr. ', '').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

const doctorCards = config.doctors.map((doc, i) => {
  const bg = i === 0
    ? `linear-gradient(135deg, ${pal.navy}, ${pal.navyLight})`
    : `linear-gradient(135deg, ${pal.navyLight}, ${pal.accent})`;
  const photo = doc.photo_url
    ? `<img src="${doc.photo_url}" alt="${doc.name}" style="width:100%;height:100%;object-fit:cover;" />`
    : `<span style="font-family:'Playfair Display',serif;font-size:4rem;font-weight:600;color:rgba(255,255,255,0.15);">${doctorInitials(doc.name)}</span>`;
  const specialtyTags = (doc.specialties || []).map(s => `<span class="cred-tag">${s}</span>`).join('');
  return `
    <div class="doctor-card">
      <div class="doctor-photo" style="background:${bg};">
        ${photo}
        <span class="doctor-photo-label">${config.practice.specialty}</span>
      </div>
      <div class="doctor-info">
        <div class="doctor-name">${doc.name}</div>
        <div class="doctor-title">${doc.credentials} — ${config.practice.specialty}</div>
        <p class="doctor-bio">${doc.bio}</p>
        <div class="doctor-creds">${specialtyTags}</div>
      </div>
    </div>`;
}).join('');

const serviceCards = config.services.map(svc => `
  <div class="service-card">
    <div class="service-icon">
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
    </div>
    <h3>${svc.name}</h3>
    <p>${svc.description}</p>
  </div>`).join('');

const testimonialCards = config.testimonials.map(t => {
  const initials = t.author.split(' ').map(w => w[0]).join('').toUpperCase();
  return `
    <div class="testimonial-card">
      <div class="stars">★★★★★</div>
      <p class="testimonial-text">"${t.text}"</p>
      <div class="testimonial-author">
        <div class="author-avatar">${initials}</div>
        <div>
          <div class="author-name">${t.author}</div>
          <div class="author-tag">${t.detail}</div>
        </div>
      </div>
    </div>`;
}).join('');

const locationCards = config.locations.map(loc => `
  <div class="contact-card">
    <div class="contact-card-icon">
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
    </div>
    <div class="contact-card-body">
      <h4>${loc.label} Office</h4>
      <p>${loc.address}</p>
      <span>${loc.city_state_zip} · ${loc.phone}</span>
    </div>
  </div>`).join('');

const trustItems = (config.trust_bar || []).map(item => `
  <div class="trust-item">
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
    ${item}
  </div>`).join('');

const statCards = (config.stats || []).map(s => `
  <div class="hero-stat">
    <span class="hero-stat-num">${s.number}</span>
    <span class="hero-stat-label">${s.label}</span>
  </div>`).join('');

const schedulingBlock = config.scheduling.url
  ? `<a href="${config.scheduling.url}" class="btn-schedule">${config.scheduling.label_scottsdale || 'Book Online'}</a>`
  : `<a href="#appointment" class="btn-schedule">Request Appointment</a>`;

const secondaryScheduling = config.scheduling.url && config.scheduling.label_secondary
  ? `<a href="${config.scheduling.url}" class="btn-schedule-outline">${config.scheduling.label_secondary}</a>`
  : '';

const servicesListItems = config.services.map(s => `
  <div class="hero-service-item">
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
    ${s.name}
  </div>`).join('');

const footerServiceLinks = config.services.slice(0, 6).map(s =>
  `<li><a href="#services">${s.name}</a></li>`).join('');

// ── GENERATE HTML ─────────────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${config.meta.page_title}</title>
  <meta name="description" content="${config.meta.description}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --navy: ${pal.navy};
      --navy-light: ${pal.navyLight};
      --accent: ${pal.accent};
      --accent-light: ${pal.accentLight};
      --gold: ${pal.gold};
      --white: #ffffff;
      --off-white: #f8f9fb;
      --light-gray: #eef0f4;
      --text: #2d3748;
      --text-light: #718096;
      --border: #e2e8f0;
      --radius: 12px;
      --shadow: 0 4px 24px rgba(0,0,0,0.08);
      --shadow-lg: 0 12px 48px rgba(0,0,0,0.14);
    }
    html { scroll-behavior: smooth; }
    body { font-family: 'Inter', sans-serif; color: var(--text); background: var(--white); line-height: 1.6; -webkit-font-smoothing: antialiased; }

    .topbar { background: var(--navy); color: rgba(255,255,255,0.75); font-size: 0.8rem; padding: 8px 0; }
    .topbar-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
    .topbar-locs { display: flex; gap: 28px; flex-wrap: wrap; }
    .topbar-loc { display: flex; align-items: center; gap: 6px; }
    .topbar-phone { color: var(--gold); font-weight: 600; text-decoration: none; font-size: 0.85rem; }
    .topbar-link { color: rgba(255,255,255,0.7); text-decoration: none; font-size: 0.78rem; transition: color 0.2s; }
    .topbar-link:hover { color: #fff; }

    nav { background: var(--white); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; display: flex; justify-content: space-between; align-items: center; height: 72px; }
    .logo { display: flex; flex-direction: column; line-height: 1.2; text-decoration: none; }
    .logo-name { font-family: 'Playfair Display', serif; font-size: 1.2rem; font-weight: 600; color: var(--navy); }
    .logo-sub { font-size: 0.68rem; font-weight: 600; color: var(--accent); letter-spacing: 0.1em; text-transform: uppercase; }
    .nav-links { display: flex; align-items: center; gap: 4px; list-style: none; }
    .nav-links a { text-decoration: none; color: var(--text-light); font-size: 0.88rem; font-weight: 500; padding: 8px 14px; border-radius: 8px; transition: all 0.2s; }
    .nav-links a:hover { color: var(--navy); background: var(--off-white); }
    .nav-cta { background: var(--accent) !important; color: #fff !important; font-weight: 600 !important; }
    .nav-cta:hover { background: var(--accent-light) !important; }

    .hero { background: linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 60%, ${pal.navyLight}dd 100%); color: #fff; padding: 100px 24px 80px; position: relative; overflow: hidden; }
    .hero-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
    .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.9); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; padding: 6px 14px; border-radius: 100px; margin-bottom: 24px; }
    .hero h1 { font-family: 'Playfair Display', serif; font-size: clamp(2rem, 4vw, 3rem); font-weight: 600; line-height: 1.15; margin-bottom: 20px; }
    .hero h1 em { font-style: normal; color: var(--gold); }
    .hero-desc { font-size: 1rem; color: rgba(255,255,255,0.75); line-height: 1.7; margin-bottom: 36px; max-width: 480px; }
    .hero-actions { display: flex; gap: 14px; flex-wrap: wrap; }
    .btn-primary { display: inline-flex; align-items: center; gap: 8px; background: var(--accent); color: #fff; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 0.95rem; text-decoration: none; transition: all 0.2s; }
    .btn-primary:hover { background: var(--accent-light); transform: translateY(-1px); }
    .btn-secondary { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.25); color: #fff; padding: 14px 28px; border-radius: 10px; font-weight: 500; font-size: 0.95rem; text-decoration: none; transition: all 0.2s; }
    .btn-secondary:hover { background: rgba(255,255,255,0.18); }
    .hero-card { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; padding: 36px; }
    .hero-card-title { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold); margin-bottom: 20px; }
    .hero-services-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
    .hero-service-item { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.06); border-radius: 8px; padding: 10px 12px; font-size: 0.82rem; color: rgba(255,255,255,0.88); font-weight: 500; }
    .hero-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden; }
    .hero-stat { background: rgba(255,255,255,0.06); padding: 14px 10px; text-align: center; }
    .hero-stat-num { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 600; color: var(--gold); display: block; }
    .hero-stat-label { font-size: 0.68rem; color: rgba(255,255,255,0.6); display: block; margin-top: 2px; }

    .trust-bar { background: var(--off-white); border-bottom: 1px solid var(--border); padding: 18px 24px; }
    .trust-inner { max-width: 1200px; margin: 0 auto; display: flex; justify-content: center; align-items: center; gap: 40px; flex-wrap: wrap; }
    .trust-item { display: flex; align-items: center; gap: 8px; font-size: 0.83rem; font-weight: 500; color: var(--text-light); }
    .trust-item svg { color: var(--accent); }

    section { padding: 80px 24px; }
    .section-inner { max-width: 1200px; margin: 0 auto; }
    .section-label { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent); margin-bottom: 10px; }
    .section-title { font-family: 'Playfair Display', serif; font-size: clamp(1.6rem, 3vw, 2.2rem); font-weight: 600; color: var(--navy); line-height: 1.2; margin-bottom: 14px; }
    .section-desc { font-size: 0.95rem; color: var(--text-light); max-width: 560px; line-height: 1.7; }
    .section-header { margin-bottom: 52px; }
    .section-header.center { text-align: center; }
    .section-header.center .section-desc { margin: 0 auto; }

    .services-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
    .service-card { background: var(--off-white); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px; transition: all 0.25s; position: relative; overflow: hidden; }
    .service-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--accent); transform: scaleX(0); transition: transform 0.25s; transform-origin: left; }
    .service-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: transparent; }
    .service-card:hover::before { transform: scaleX(1); }
    .service-icon { width: 44px; height: 44px; background: rgba(42,125,111,0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; color: var(--accent); }
    .service-card h3 { font-size: 1rem; font-weight: 600; color: var(--navy); margin-bottom: 8px; }
    .service-card p { font-size: 0.85rem; color: var(--text-light); line-height: 1.65; }

    .doctors-section { background: var(--off-white); }
    .doctors-grid { display: grid; grid-template-columns: repeat(${Math.min(config.doctors.length, 3)}, 1fr); gap: 24px; }
    .doctor-card { background: #fff; border-radius: 14px; overflow: hidden; box-shadow: var(--shadow); transition: all 0.25s; }
    .doctor-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
    .doctor-photo { height: 200px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
    .doctor-photo-label { position: absolute; bottom: 12px; left: 12px; background: var(--accent); color: #fff; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 10px; border-radius: 100px; }
    .doctor-info { padding: 24px; }
    .doctor-name { font-family: 'Playfair Display', serif; font-size: 1.2rem; font-weight: 600; color: var(--navy); margin-bottom: 3px; }
    .doctor-title { font-size: 0.8rem; color: var(--accent); font-weight: 600; margin-bottom: 12px; }
    .doctor-bio { font-size: 0.85rem; color: var(--text-light); line-height: 1.65; margin-bottom: 16px; }
    .doctor-creds { display: flex; flex-wrap: wrap; gap: 6px; }
    .cred-tag { background: var(--light-gray); color: var(--navy); font-size: 0.7rem; font-weight: 600; padding: 3px 9px; border-radius: 5px; }

    .testimonials-section { background: var(--light-gray); }
    .testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
    .testimonial-card { background: #fff; border-radius: var(--radius); padding: 26px; box-shadow: var(--shadow); }
    .stars { color: var(--gold); font-size: 1rem; margin-bottom: 14px; letter-spacing: 2px; }
    .testimonial-text { font-size: 0.88rem; color: var(--text); line-height: 1.68; margin-bottom: 18px; font-style: italic; }
    .testimonial-author { display: flex; align-items: center; gap: 10px; }
    .author-avatar { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, var(--navy), var(--accent)); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem; color: #fff; }
    .author-name { font-weight: 600; font-size: 0.85rem; color: var(--navy); }
    .author-tag { font-size: 0.73rem; color: var(--text-light); }

    .appt-section { background: #fff; }
    .appt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: start; }
    .appt-form { background: var(--off-white); border: 1px solid var(--border); border-radius: 18px; padding: 36px; }
    .form-title { font-family: 'Playfair Display', serif; font-size: 1.4rem; color: var(--navy); margin-bottom: 5px; }
    .form-subtitle { font-size: 0.85rem; color: var(--text-light); margin-bottom: 24px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-group { margin-bottom: 14px; }
    .form-group label { display: block; font-size: 0.78rem; font-weight: 600; color: var(--text-light); margin-bottom: 5px; }
    .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px 13px; border: 1.5px solid var(--border); border-radius: 7px; font-size: 0.88rem; font-family: 'Inter', sans-serif; color: var(--text); background: #fff; outline: none; transition: border-color 0.2s; }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: var(--accent); }
    .form-group textarea { resize: vertical; min-height: 80px; }
    .form-submit { width: 100%; padding: 13px; background: var(--accent); color: #fff; border: none; border-radius: 9px; font-size: 0.92rem; font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.2s; margin-top: 6px; }
    .form-submit:hover { background: var(--accent-light); }
    .hipaa-notice { display: flex; align-items: flex-start; gap: 7px; margin-top: 12px; padding: 10px 12px; background: rgba(42,125,111,0.06); border: 1px solid rgba(42,125,111,0.18); border-radius: 7px; font-size: 0.74rem; color: var(--text-light); line-height: 1.5; }
    .contact-card { background: var(--off-white); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px 20px; display: flex; gap: 14px; align-items: flex-start; margin-bottom: 12px; }
    .contact-card-icon { width: 38px; height: 38px; background: rgba(42,125,111,0.1); border-radius: 9px; display: flex; align-items: center; justify-content: center; color: var(--accent); flex-shrink: 0; }
    .contact-card-body h4 { font-size: 0.68rem; font-weight: 700; color: var(--navy); margin-bottom: 3px; letter-spacing: 0.08em; text-transform: uppercase; }
    .contact-card-body p { font-size: 0.88rem; color: var(--text); font-weight: 500; }
    .contact-card-body span { font-size: 0.78rem; color: var(--text-light); }

    .schedule-banner { background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%); color: #fff; padding: 28px 24px; }
    .schedule-banner-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
    .schedule-banner-text h3 { font-family: 'Playfair Display', serif; font-size: 1.3rem; margin-bottom: 4px; }
    .schedule-banner-text p { font-size: 0.86rem; opacity: 0.88; }
    .schedule-actions { display: flex; gap: 12px; flex-wrap: wrap; }
    .btn-schedule { display: inline-flex; align-items: center; gap: 8px; background: #fff; color: var(--accent); padding: 12px 24px; border-radius: 9px; font-weight: 700; font-size: 0.9rem; text-decoration: none; transition: all 0.2s; }
    .btn-schedule:hover { transform: translateY(-2px); }
    .btn-schedule-outline { display: inline-flex; align-items: center; gap: 8px; background: transparent; border: 2px solid rgba(255,255,255,0.5); color: #fff; padding: 10px 22px; border-radius: 9px; font-weight: 600; font-size: 0.9rem; text-decoration: none; transition: all 0.2s; }
    .btn-schedule-outline:hover { background: rgba(255,255,255,0.15); border-color: #fff; }

    footer { background: var(--navy); color: rgba(255,255,255,0.65); padding: 56px 24px 28px; }
    .footer-inner { max-width: 1200px; margin: 0 auto; }
    .footer-top { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 36px; margin-bottom: 40px; }
    .footer-logo-name { font-family: 'Playfair Display', serif; font-size: 1.15rem; color: #fff; margin-bottom: 3px; }
    .footer-logo-sub { font-size: 0.68rem; color: var(--accent-light); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; }
    .footer-desc { font-size: 0.82rem; line-height: 1.7; color: rgba(255,255,255,0.5); max-width: 260px; }
    .footer-col h4 { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold); margin-bottom: 14px; }
    .footer-links { list-style: none; display: flex; flex-direction: column; gap: 9px; }
    .footer-links a { font-size: 0.83rem; color: rgba(255,255,255,0.55); text-decoration: none; transition: color 0.2s; }
    .footer-links a:hover { color: #fff; }
    .footer-bottom { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 22px; display: flex; justify-content: space-between; align-items: center; font-size: 0.76rem; color: rgba(255,255,255,0.35); flex-wrap: wrap; gap: 8px; }
    .footer-bottom a { color: rgba(255,255,255,0.35); text-decoration: none; }
    .footer-bottom a:hover { color: rgba(255,255,255,0.65); }

    .float-cta { position: fixed; bottom: 28px; right: 28px; z-index: 200; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
    .float-btn { display: flex; align-items: center; gap: 8px; padding: 13px 20px; border-radius: 100px; font-weight: 600; font-size: 0.88rem; text-decoration: none; box-shadow: 0 4px 20px rgba(0,0,0,0.18); transition: all 0.2s; }
    .float-btn:hover { transform: translateY(-2px); }
    .float-btn.call { background: var(--navy); color: #fff; }
    .float-btn.appt { background: var(--accent); color: #fff; }

    ${chatCSS}

    @media (max-width: 900px) {
      .hero-inner, .appt-grid { grid-template-columns: 1fr; }
      .hero-card { display: none; }
      .services-grid, .testimonials-grid { grid-template-columns: 1fr 1fr; }
      .doctors-grid { grid-template-columns: 1fr; }
      .footer-top { grid-template-columns: 1fr 1fr; }
      .nav-links { display: none; }
    }
    @media (max-width: 600px) {
      .services-grid, .testimonials-grid { grid-template-columns: 1fr; }
      section { padding: 56px 20px; }
    }
  </style>
</head>
<body>

  <div class="topbar">
    <div class="topbar-inner">
      <div class="topbar-locs">
        ${config.locations.map(l => `<div class="topbar-loc"><svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>${l.address}, ${l.city_state_zip}</div>`).join('')}
      </div>
      <div style="display:flex;align-items:center;gap:20px;">
        <a href="tel:${config.contact.phone_primary.replace(/\D/g,'')}" class="topbar-phone">${config.contact.phone_primary}</a>
        ${config.patient_portal_url ? `<a href="${config.patient_portal_url}" class="topbar-link">Patient Portal</a>` : ''}
      </div>
    </div>
  </div>

  <nav>
    <div class="nav-inner">
      <a href="#" class="logo">
        <span class="logo-name">${config.practice.name}</span>
        <span class="logo-sub">${config.practice.specialty}</span>
      </a>
      <ul class="nav-links">
        <li><a href="#services">Services</a></li>
        <li><a href="#doctors">Our Doctors</a></li>
        <li><a href="#contact">Locations</a></li>
        <li><a href="#appointment" class="nav-cta">Request Appointment</a></li>
      </ul>
    </div>
  </nav>

  <section class="hero">
    <div class="hero-inner">
      <div>
        <div class="hero-badge">${config.practice.specialty}</div>
        <h1>${config.practice.tagline || `Expert Dental Care<br/>in <em>${config.locations[0]?.city_state_zip?.split(',')[0] || 'Your City'}</em>`}</h1>
        <p class="hero-desc">${config.practice.about}</p>
        <div class="hero-actions">
          <a href="#appointment" class="btn-primary">Request Appointment</a>
          <a href="tel:${config.contact.phone_primary.replace(/\D/g,'')}" class="btn-secondary">Call ${config.contact.phone_primary}</a>
        </div>
      </div>
      <div class="hero-card">
        <div class="hero-card-title">Our Services</div>
        <div class="hero-services-grid">${servicesListItems}</div>
        <div class="hero-stats">${statCards}</div>
      </div>
    </div>
  </section>

  <div class="trust-bar"><div class="trust-inner">${trustItems}</div></div>

  <section id="services"><div class="section-inner">
    <div class="section-header">
      <div class="section-label">What We Offer</div>
      <h2 class="section-title">Comprehensive Dental Care</h2>
      <p class="section-desc">From routine checkups to advanced procedures, our team provides the full scope of dental services your family needs.</p>
    </div>
    <div class="services-grid">${serviceCards}</div>
  </div></section>

  <section id="doctors" class="doctors-section"><div class="section-inner">
    <div class="section-header center">
      <div class="section-label">Meet Our Team</div>
      <h2 class="section-title">Your Doctors</h2>
      <p class="section-desc">Experienced, caring, and committed to your long-term oral health.</p>
    </div>
    <div class="doctors-grid">${doctorCards}</div>
  </div></section>

  <section class="testimonials-section"><div class="section-inner">
    <div class="section-header center">
      <div class="section-label">Patient Reviews</div>
      <h2 class="section-title">What Our Patients Say</h2>
    </div>
    <div class="testimonials-grid">${testimonialCards}</div>
  </div></section>

  <div class="schedule-banner">
    <div class="schedule-banner-inner">
      <div class="schedule-banner-text">
        <h3>Ready to Book? Schedule Online in 60 Seconds.</h3>
        <p>Pick a time that works — no phone tag required.</p>
      </div>
      <div class="schedule-actions">${schedulingBlock}${secondaryScheduling}</div>
    </div>
  </div>

  <section class="appt-section" id="appointment"><div class="section-inner">
    <div class="appt-grid">
      <div class="appt-form">
        <div class="form-title">Request an Appointment</div>
        <div class="form-subtitle">We'll confirm within one business day.</div>
        <div class="form-row">
          <div class="form-group"><label>First Name</label><input type="text" placeholder="Jane" /></div>
          <div class="form-group"><label>Last Name</label><input type="text" placeholder="Smith" /></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Phone</label><input type="tel" placeholder="${config.contact.phone_primary}" /></div>
          <div class="form-group"><label>Email</label><input type="email" placeholder="jane@email.com" /></div>
        </div>
        ${config.locations.length > 1 ? `<div class="form-group"><label>Preferred Location</label><select>${config.locations.map(l => `<option>${l.label} — ${l.address}</option>`).join('')}</select></div>` : ''}
        <div class="form-group"><label>Reason for Visit</label><select><option value="">Select a service</option>${config.services.map(s => `<option>${s.name}</option>`).join('')}</select></div>
        <div class="form-group"><label>Additional Notes</label><textarea placeholder="Any details or special requests..."></textarea></div>
        <button class="form-submit">Submit Appointment Request</button>
        <div class="hipaa-notice">🔒 SSL encrypted. Please do not include sensitive medical records or insurance info. By submitting, you acknowledge our <a href="#" style="color:var(--accent)">Notice of Privacy Practices</a>.</div>
      </div>
      <div id="contact">
        <div class="section-label">Get In Touch</div>
        <h2 class="section-title" style="margin-bottom:10px;">Come See Us</h2>
        <p class="section-desc" style="margin-bottom:28px;">We're here Monday–Friday and happy to answer any questions before your visit.</p>
        ${locationCards}
        <div class="contact-card">
          <div class="contact-card-icon"><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
          <div class="contact-card-body"><h4>Hours</h4><p>${config.contact.hours}</p></div>
        </div>
      </div>
    </div>
  </div></section>

  <footer>
    <div class="footer-inner">
      <div class="footer-top">
        <div>
          <div class="footer-logo-name">${config.practice.name}</div>
          <div class="footer-logo-sub">${config.practice.specialty}</div>
          <p class="footer-desc">${config.meta.description}</p>
        </div>
        <div class="footer-col">
          <h4>Services</h4>
          <ul class="footer-links">${footerServiceLinks}</ul>
        </div>
        <div class="footer-col">
          <h4>Patient Info</h4>
          <ul class="footer-links">
            <li><a href="#">New Patients</a></li>
            <li><a href="#">Insurance</a></li>
            <li><a href="#">Patient Forms</a></li>
            ${config.patient_portal_url ? `<li><a href="${config.patient_portal_url}">Patient Portal</a></li>` : ''}
          </ul>
        </div>
        <div class="footer-col">
          <h4>Contact</h4>
          <ul class="footer-links">
            ${config.locations.map(l => `<li><a href="tel:${l.phone.replace(/\D/g,'')}">${l.phone} · ${l.label}</a></li>`).join('')}
            <li><a href="#appointment">Request Appointment</a></li>
            ${config.social.instagram ? `<li><a href="${config.social.instagram}">Instagram</a></li>` : ''}
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ${new Date().getFullYear()} ${config.practice.name}. All rights reserved.</span>
        <span><a href="#">Privacy Policy</a> · <a href="#">Notice of Privacy Practices (HIPAA)</a> · <a href="#">Accessibility</a></span>
      </div>
    </div>
  </footer>

  <div class="float-cta">
    <a href="tel:${config.contact.phone_primary.replace(/\D/g,'')}" class="float-btn call">
      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
      Call Now
    </a>
    <a href="#appointment" class="float-btn appt">
      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
      Book Online
    </a>
  </div>

  ${chatHTML}

  ${chatScript}
</body>
</html>`;

// ── WRITE OUTPUT ──────────────────────────────────────────────────────────────
const slug = config.meta.client_slug || 'client';
const outDir = path.join(__dirname, 'clients', slug);
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'index.html');
fs.writeFileSync(outPath, html);

console.log(`\n✅ Site generated: ${outPath}`);
console.log(`   Practice:  ${config.practice.name}`);
console.log(`   Palette:   ${config.palette}`);
console.log(`   Doctors:   ${config.doctors.length}`);
console.log(`   Services:  ${config.services.length}`);
console.log(`\n   Preview:   open ${outPath}\n`);
