# Point Zero AI — White Coat Website Product
## CLAUDE.md — Persistent Project Instructions

Read this file completely before doing any work in this project. These are standing orders that apply to every task, every client, every session.

---

## What This Product Is

Point Zero AI builds **premium, custom websites for healthcare professionals** ("white coats") — dentists, oral surgeons, orthodontists, plastic surgeons, dermatologists, ophthalmologists, orthopedic surgeons, chiropractors, OB/GYNs, veterinarians, and any other specialty where the doctor has a private practice and a big ego.

**The business model:**
- Option A: $1,599 one-time + $149/month hosting (1 revision round)
- Option B: $2,500 flat — includes 12 months hosting + 3 revision rounds, then $149/month
- No payment plans. No negotiating price. One price, done in 2 weeks.
- Tom Zgainer (founder, Point Zero AI) has 900 existing dental clients as the launch list
- Dental is the beachhead. White coats is the full market.

**The product promise:** A site that looks like it cost $20,000, built in 2 weeks, for $2,500. Premium, ego-stroking, patient-converting.

---

## Repository & Deployment

- **GitHub:** https://github.com/tzgainer-hub/dental-prototype.git
- **Live URL:** https://dental-prototype-production.up.railway.app
- **Deploy:** Auto-deploy via Railway on every push to `main`
- **Stack:** Static HTML + CSS + Vanilla JS. No build step. No frameworks. Files serve directly.
- **Server:** server.js (Express, serves static files from root)

**To deploy any change:**
```bash
cd "/Users/thomaszgainer/Desktop/ClaudeWork /dental-prototype"
git add [files]
git commit -m "description"
git push
```
Railway picks it up automatically. Live in ~60 seconds.

---

## File Structure

```
dental-prototype/
├── index.html          ← Home page
├── services.html       ← Our Services + Before/After gallery
├── about.html          ← About Us + Technology
├── team.html           ← Surgeons + Support Staff
├── contact.html        ← Appointment form + Map + FAQ
├── styles.css          ← ALL shared CSS (never inline styles in HTML pages)
├── pricing.html        ← Fee schedule (Option A vs B) — send to prospects
├── intake-form.html    ← Client onboarding form — send after close
├── hub.html            ← Internal sales hub for closers
├── outreach-emails.html ← 3-touch email sequence for 900-client campaign
├── sms-sequence.html   ← SMS text sequence + phone scripts
├── server.js           ← Express static file server for Railway
├── package.json
└── CLAUDE.md           ← This file
```

---

## COLOR PSYCHOLOGY — DENTAL WEBSITES (RESEARCH-BACKED — DO NOT SKIP)

This section is based on clinical color psychology research cross-referenced with an audit of the top 40 dental websites in the Phoenix market (conducted April 2026). This is the foundation for ALL color decisions on every white coat site we build.

### The Rules

**Rule 1: White background dominates.**
82.5% of top-performing dental sites use a stark WHITE background. Not cream. Not light gray. White. It signals clinical cleanliness, modern transparency, and trust. Dark backgrounds (navy, charcoal, black) are for tech companies and law firms — NOT dental practices. Exception: footers, nav bars, and CTA buttons can be dark.

**Rule 2: Dental patients are scared. Design for calm, not impressive.**
Dental anxiety is the #1 conversion barrier. Every color choice must ask: "Does this make a nervous patient feel safe?" Dark, cold, dramatic = wrong. Light, warm, open = right.

**Rule 3: The winning color families (Phoenix market audit):**
| Color Family | % of Top Sites | Notes |
|---|---|---|
| Teal / Aqua / Blue-Green | 37.5% | #1 dominant — our teal (#0891b2) is validated |
| Navy / Sky Blue | 22.5% | As accents, not backgrounds |
| Earth Tones (Brown/Tan/Sage) | 20.0% | Warm, natural, calming |
| Other | 20.0% | Soft greens, muted lavender, etc. |

**Rule 4: Colors to NEVER use as primary in dental:**
- **Red** — raises body tension and anxiety. Even subconsciously.
- **Bright yellow** — elicits tense reactions in large quantities. Amber as a CTA accent is fine. Bright yellow as a background is not.
- **Dark navy as a hero background** — reads as cold and clinical. Patients avoid it.

### What This Means for Every Build

- **Hero section:** White or very light background. Period.
- **Teal (#0891b2):** Validated. Use it as accents, borders, buttons, eyebrows, credential text.
- **Amber (#f59e0b):** Valid for CTAs — warm, action-oriented, not aggressive.
- **Dark navy (#0c1a2e):** Footer, nav, and text ONLY. Never as a hero or large background section.
- **Photos:** Warm, aspirational, smiling humans — clearly visible, never darkened with overlays. Real people, real warmth.
- **White space:** Use aggressively. Breathing room = calm = trust.

### The 3 Proven Palettes (Use These — Don't Invent New Ones)

**Palette 1: "The Clinical Trust"** — General Dentistry, Cosmetic, Family
- Background: Crisp White `#FFFFFF`
- Primary: Navy `#1B3A5C` or Slate Blue `#2574A9`
- Accent: Soft Gray `#F4F4F4`
- CTA Button: Warm Orange `#F57C00`
- Why: Blue builds trust and stability. White signals hygiene. Orange converts without red's anxiety trigger.

**Palette 2: "The Calming Wellness"** — Pediatric, Holistic, General
- Background: Off-White/Cream `#FAFAFA`
- Primary: Sage Green `#79997C` or Deep Teal `#244D4D`
- Accent: Soft Aqua `#84C5BD`
- CTA Button: Soft Gold `#FFEE84`
- Why: Green lowers heart rate and reduces stress. Scientifically proven for anxiety reduction.

**Palette 3: "The Premium Boutique"** — Oral Surgery, Implants, Prosthodontics, Specialists
- Background: Crisp White `#FFFFFF`
- Primary: Warm Charcoal `#333333`
- Accent: Warm Taupe/Brown `#A88D6C`
- CTA Button: Muted Gold `#C5A880`
- Why: High-revenue specialty practices moving toward luxury hotel/spa aesthetic. Premium without cold.

### Per-Specialty Assignment

| Specialty | Palette | Notes |
|---|---|---|
| Oral Surgery | Premium Boutique OR Clinical Trust | High-end, specialist, surgical |
| General Dentistry | Clinical Trust | Approachable, family, trusted |
| Orthodontics | Clinical Trust | Modern, optimistic |
| Pediatric Dentistry | Calming Wellness | Fun, safe, non-threatening |
| Plastic Surgery | Premium Boutique | Luxury, transformation |
| Dermatology | Calming Wellness | Natural, skin, clean |
| Periodontics | Clinical Trust | Clinical, precise |
| Prosthodontics | Premium Boutique | High-end specialty |

### Our Existing Color System vs. Research

Our teal (`#0891b2`) is VALIDATED — 37.5% of top dental sites use teal/aqua as primary.
Our amber (`#f59e0b`) is VALIDATED — warm orange/gold CTAs are the top converter.
Our dark navy (`#0c1a2e`) as a HERO BACKGROUND is WRONG — falls in "avoid" category with black/dark gray.
**Dark navy belongs in: footers, nav bars, text, and accents ONLY. Never as a large background section.**

---

## Design System — Never Deviate From These

### CSS Custom Properties (defined in styles.css)
```css
--teal:        #0891b2    /* Primary brand color */
--teal-dark:   #0e7490
--teal-deeper: #164e63
--teal-bg:     #f0fdff
--teal-mid:    #cffafe
--amber:       #f59e0b    /* CTA / button accent */
--amber-dark:  #d97706
--dark:        #0c1a2e    /* Navy — headings, nav, footer */
--text:        #1e293b
--muted:       #64748b
--light:       #94a3b8
--bg:          #ffffff
--bg-warm:     #f8fafc
--bg-teal:     #f0fdfa
--border:      #e2e8f0
--radius:      14px
```

### Typography
- **Headlines:** `Cormorant Garamond` (serif) — prestigious, medical, premium feel
- **Body:** `Inter` (sans-serif) — clean, readable, modern
- Google Fonts link required in every page `<head>`:
```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
```

### Visual Tone
- Warm, premium, trustworthy — NOT cold or clinical
- Reference sites to match: phoenixoralsurgeons.com, adcchandler.com, canyonlakesdentist.com
- Photography: Unsplash hotlinks acceptable. Use real, high-quality smiling people.
  - Known good URL: `https://images.unsplash.com/photo-1494790108377-be9c29b29330` (beautiful smiling woman, hero-appropriate)
- Icons: Always inline SVG line-art. Never emoji in production design elements.
- Shadows: Layered — `--shadow-sm`, `--shadow`, `--shadow-lg`

---

## Page Architecture — 5 Pages

Every nav link goes to a real page. No anchor-link scrolling between nav items. This is a hard rule.

### Navigation (same across all pages)
```
Home | Our Services | About Us | Our Team | Patient Info | [Book Appointment button]
```

Active page gets class `nav-active` on its `<li><a>` element.

### Page 1: index.html (Home)
- Topbar (locations, phone numbers)
- Sticky nav
- Hero (large, photo right, headlines left, rotating patient reviews, two CTAs)
- Google Reviews bar (star ratings, review count, source links)
- Awards / recognition bar
- Services overview — 6 cards (each "Learn More →" links to services.html)
- Stats/counters (animated on scroll)
- Testimonials carousel
- CTA band
- Footer

### Page 2: services.html (Our Services)
- Interior page hero (dark teal, breadcrumb)
- All 6 service cards with full descriptions
- Before/After gallery with filter buttons
- Insurance logos grid
- CTA band
- Footer

### Page 3: about.html (About Us)
- Interior page hero
- About section (practice story, differentiators, about cards with SVG icons)
- Advanced Technology section (equipment list with icons)
- Stats counters
- CTA band
- Footer

### Page 4: team.html (Our Team)
- Interior page hero
- Surgeons section (doctor cards — photo, credentials, bio, hospital affiliations)
- Support staff section (smaller cards — name, title, photo)
- CTA band
- Footer

### Page 5: contact.html (Patient Info)
- Interior page hero
- Appointment request form (location dropdown, service, preferred time, notes)
- Location cards with real addresses + Get Directions links
- Google Maps iframe
- FAQ accordion
- CTA band
- Footer

### Interior Page Hero (used on pages 2–5)
```html
<section class="page-hero">
  <div class="section-inner">
    <div class="page-hero-eyebrow">[EYEBROW]</div>
    <h1 class="page-hero-title">[PAGE TITLE]</h1>
    <div class="page-hero-breadcrumb"><a href="index.html">Home</a> → [Page Name]</div>
  </div>
</section>
```

---

## Shared Components (Required on Every Page)

### 1. Topbar
Dark teal bar at very top. Shows:
- Locations (city names only in topbar, not full addresses)
- Primary phone number (amber/yellow color, prominent)
- Patient Portal link, Pay My Bill link (placeholders until client provides URLs)

### 2. Sticky Nav
White background, box shadow, `position: sticky; top: 0; z-index: 200`.
- Logo area: supports image file OR text fallback
  ```html
  <!-- IMAGE LOGO: uncomment when client provides file -->
  <!-- <img src="logo.png" alt="[Practice Name]" class="logo-img" /> -->
  <div class="logo-text">
    <span class="logo-name">[Practice Name]</span>
    <span class="logo-sub">[Specialty]</span>
  </div>
  ```
  Logo image CSS: `max-height: 52px; width: auto; max-width: 260px; object-fit: contain;`
- Nav links (5 items)
- Phone button (outline style)
- Book Appointment button (amber, links to contact.html)
- Mobile hamburger (hidden on desktop, JS toggle)

### 3. tawk.to Live Chat
**Optional per client** (intake form asks if they want it and who will staff it).
- Point Zero AI account: property_id `69cdbcadb8aa781c3b30ef8f`, widget_id `1jl5qi1c1`
- For client's own tawk.to: swap these IDs per client
- **On mobile: hide the floating bubble via JS API** — the Chat button in the sticky bar opens it instead
- Place the script just before `</body>`:
```html
<!--Start of Tawk.to Script-->
<script type="text/javascript">
var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
Tawk_API.onLoad = function() {
  if (window.innerWidth <= 768) { Tawk_API.hideWidget(); }
};
(function(){
var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
s1.async=true;
s1.src='https://embed.tawk.to/69cdbcadb8aa781c3b30ef8f/1jl5qi1c1';
s1.charset='UTF-8';
s1.setAttribute('crossorigin','*');
s0.parentNode.insertBefore(s1,s0);
})();
</script>
<!--End of Tawk.to Script-->
```
**Do NOT use CSS to reposition tawk.to** — it renders in an iframe and ignores external CSS.
Desktop: bubble shows bottom-right as normal. Mobile: hidden, opened via Chat button in sticky bar.

### 4. Mobile Sticky CTA Bar
Fixed bottom bar, shows only on mobile (≤768px). **Three equal buttons: Call | Book | Chat.**
- Call → `tel:` link to primary phone
- Book → `contact.html`
- Chat → opens tawk.to via `Tawk_API.toggle()` (JS, not a link)
```html
<div class="mobile-sticky-cta" id="mobile-sticky">
  <a href="tel:[PHONE]" class="mobile-sticky-call">
    <svg>...</svg> Call
  </a>
  <a href="contact.html" class="mobile-sticky-book">
    <svg>...</svg> Book
  </a>
  <button class="mobile-sticky-chat" onclick="if(window.Tawk_API){Tawk_API.toggle();}">
    <svg>...</svg> Chat
  </button>
</div>
```
If client opted out of chat on intake form: remove the Chat button and make Call + Book split the full width.

### 5. Footer
Three-column layout:
- Col 1: Logo, tagline, phone numbers, social icons
- Col 2: Services links (→ services.html)
- Col 3: Practice links (about, team, reviews, FAQ, contact)
- Bottom bar: copyright, Privacy Policy, Terms, Accessibility, Sitemap

### 6. JavaScript (bottom of every page)
```javascript
// Scroll reveal
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// Stat counters (only run if elements exist)
const statEls = document.querySelectorAll('[data-target]');
if (statEls.length) {
  // ... counter animation logic
}

// Mobile menu toggle
document.getElementById('hamburger')?.addEventListener('click', () => {
  document.getElementById('mobile-menu')?.classList.toggle('open');
});
```

---

## Content Rules — Absolute

1. **Never use fake/placeholder data in a client site.** No "123 Main St", no "(555) 555-1234", no "Dr. John Smith". If real data isn't available yet, use clearly marked `[PLACEHOLDER]` text.
2. **Addresses and phone numbers are the #1 priority for new patients.** Get them right. Put them prominently. Link phone numbers with `tel:` and addresses with Google Maps links.
3. **Google Maps direction links format:**
   ```
   https://maps.google.com/?q=[ADDRESS+URL+ENCODED]
   ```
4. **Doctor names must include full credentials** (e.g., DMD, MD, FACS, FAACS). Dentists and surgeons have earned those letters. Use them.
5. **Location count must be accurate.** Never say "3 locations" if there are 2.
6. **Never invent awards, affiliations, or certifications.** Only list what the client provides.

---

## Scroll Reveal Animations

Add class `reveal` to any element that should animate in on scroll. CSS handles the rest:
```css
.reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
.reveal.visible { opacity: 1; transform: none; }
```

---

## Stat Counters

Use `data-target` and optional `data-suffix` attributes:
```html
<div class="stat-number" data-target="4.9" data-suffix="★">0</div>
<div class="stat-number" data-target="2400" data-suffix="+">0</div>
```
JS animates from 0 to target value over ~1.5s on first scroll into view.

---

## Before/After Gallery

Filter buttons use `data-filter` attribute, cards use `data-category`:
```html
<button class="ba-filter active" data-filter="all">All Cases</button>
<button class="ba-filter" data-filter="implants">Implants</button>

<div class="ba-card" data-category="implants">...</div>
```
JS toggles `.hidden` class on cards based on active filter.

---

## How to Build a New Client Site

When a new client is onboarded:

### Step 1: Get the intake form back
Client fills out `/intake-form.html`. This gives you:
- Practice name, specialty, tagline
- All doctor names and credentials
- Location addresses and phone numbers (up to 3)
- Office hours
- Services offered (checkbox list)
- Insurance accepted
- Logo file (image format, dimensions)
- Brand colors (if custom, otherwise use default teal/amber)
- Reference websites they like
- Awards and hospital affiliations
- Before/after photos (if available)
- Social media URLs

### Step 2: Create a client config
Create a new folder: `/clients/[practice-slug]/`
Create `config.json` with all intake form data.

### Step 3: Fork the template
Copy all 5 HTML files + styles.css into the client folder.
Find and replace all SSA-specific content with client data.

### Step 4: Key substitutions checklist
- [ ] `<title>` tag — practice name + specialty
- [ ] Meta description
- [ ] Logo (uncomment img tag, set src; OR update logo-text)
- [ ] All phone numbers (topbar, nav, hero, footer, mobile sticky CTA, tel: links)
- [ ] All addresses (topbar, footer, contact page location cards, Google Maps links)
- [ ] Location count ("2 Locations" etc.)
- [ ] Doctor names, credentials, bios, and photos
- [ ] Staff names and titles
- [ ] Services list (update all 6 service cards)
- [ ] Practice specialty (meta, headings, footer tagline)
- [ ] Awards and affiliations
- [ ] Insurance logos accepted
- [ ] tawk.to IDs (if client has own account, or use PZ AI account)
- [ ] Google Maps iframe embed URL
- [ ] Social media links in footer
- [ ] Before/after categories (match to their actual services)
- [ ] FAQ content (specialty-appropriate questions)

### Step 5: Deploy
Create new Railway project linked to client's GitHub repo.
Or push to a subdirectory and configure routing.

---

## White Coats Expansion — Specialty Adaptations

The template works for any white coat specialty. Key changes per specialty:

| Specialty | Service Cards | Before/After Categories | Tech Section Focus | Ego Hook |
|-----------|--------------|------------------------|-------------------|----------|
| General Dentist | Cleanings, Whitening, Crowns, Implants, Invisalign, Root Canal | Whitening, Veneers, Implants | Digital X-ray, CEREC, Laser | Family practice, years serving community |
| Oral Surgeon | Implants, Wisdom Teeth, Bone Graft, Jaw Surgery, Facial Trauma, Sedation | Implants, Full Arch, Reconstruction | CBCT, Piezo, IV Sedation | Fellowship-trained, board certified (FACS/FAACS) |
| Orthodontist | Invisalign, Braces, Retainers, Expanders, Teen, Adult | Bite Correction, Smile Transformation | iTero Scanner, Digital Planning | AAO member, certified Invisalign provider |
| Plastic Surgeon | Rhinoplasty, Facelift, Breast Augmentation, Body Contouring, Injectables, Non-surgical | Facial, Body, Breast, Non-surgical | 3D imaging, accredited OR | Board certified (ABPS), Ivy-trained |
| Dermatologist | Medical Derm, Cosmetic, Skin Cancer, Mohs, Laser, Injectables | Acne, Anti-aging, Skin Cancer, Laser | MOHS lab, laser suite | Board certified AAD, fellowship trained |
| Ophthalmologist | LASIK, Cataract, Glaucoma, Retina, Dry Eye, Cosmetic | Vision Correction, Cataract, Cosmetic | Zeiss equipment, surgical suite | Sub-specialty fellowship, hospital affiliation |

**Universal ego hooks (all specialties):**
- Board certification + which board
- Fellowship training + where
- Hospital affiliations
- Number of procedures performed
- Years in practice
- Awards and recognition (Castle Connolly, Top Doctor, Best of City, etc.)
- Publications or teaching appointments

---

## The Sales Collateral (Do Not Modify These Without Tom's Approval)

| File | Purpose |
|------|---------|
| `pricing.html` | Fee schedule — send to warm prospects |
| `intake-form.html` | Onboarding form — send immediately after close |
| `hub.html` | Closer sales hub — one link for everything |
| `outreach-emails.html` | 3-touch email sequence for 900-client campaign |
| `sms-sequence.html` | SMS sequence + phone scripts |

Pricing is fixed: **$1,599 + $149/mo** (Option A) or **$2,500 flat** (Option B, recommended). Do not suggest discounts, payment plans, or custom pricing.

---

## Tom Zgainer — Founder Context

- Founder of Point Zero AI (umbrella company)
- Has 900 existing dental clients from prior business — these are warm leads
- His son and girlfriend are the closers working the 900-client outreach
- Communication style: direct, high-level, non-technical. Skip the dev jargon.
- Priorities: speed to market, premium look, scalable product, ego-appropriate for doctors
- The product must be replicable: build once, customize fast, deploy same day

---

## Common Mistakes — Never Do These

1. **Don't put inline `<style>` blocks in HTML pages.** All CSS goes in `styles.css`.
2. **Don't use emoji as design elements.** Use inline SVG icons.
3. **Don't use anchor links (`#section`) in the nav.** Every nav item is a real page link.
4. **Don't invent practice data.** Real addresses, real phones, real doctor names only.
5. **Don't say "3 locations" if there are 2** (or any other wrong count).
6. **Don't remove the tawk.to embed** from any page.
7. **Don't change pricing** without Tom's explicit approval.
8. **Don't use generic agency language** in copy ("innovative solutions", "cutting-edge care"). Write like a premium practice, not a web agency.
9. **Don't skip the mobile sticky CTA** — it's a top conversion driver on mobile.
10. **Don't use placeholder Unsplash photos of random objects or unattractive subjects.** Always preview or use known-good URLs.

---

## Reference: The Scottsdale Surgical Arts Demo

The live demo at `https://dental-prototype-production.up.railway.app` is built on real SSA data:

- **Practice:** Scottsdale Surgical Arts — Oral & Maxillofacial Surgery
- **Doctors:** Dr. Devin M. Wahlstrom, DMD, FACS, FAACS + Dr. Carl J. Gassmann, MD, DDS
- **Scottsdale:** 10603 North Hayden Road, Suite H-112, Scottsdale AZ 85260 · (480) 922-9933
- **Sedona:** 2935 Southwest Drive, Suite 100, Sedona AZ 86336 · (928) 282-1224
- **Real site for reference:** gassmannoms.com

This demo is the primary sales tool. Every prospect sees this before anything else.

---

*Last updated: Session where multi-page architecture was built + white coats expansion identified.*
*Point Zero AI · onboarding@pointzeroai.com*
