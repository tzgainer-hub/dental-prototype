# White Coat Websites — Design System
## Point Zero AI · Updated April 2026

This file is the master design rulebook for every White Coat Website built by Point Zero AI. Read this before touching any HTML or CSS. Stitch and Claude both read this file to stay consistent across every build.

---

## Brand Identity

**Product:** White Coat Websites — premium website product for healthcare professionals
**Price Promise:** Looks like it cost $20,000. Built in 2 weeks. $2,500 all-in.
**Audience:** Healthcare practice owners (dentists, oral surgeons, dermatologists, etc.) and their patients
**Tone:** Warm, premium, trustworthy. Ego-appropriate for doctors. Never cold, clinical, or corporate.

---

## Color System

### CSS Custom Properties
```css
--teal:        #0891b2    /* Primary brand — validated by Phoenix market audit */
--teal-dark:   #0e7490
--teal-deeper: #164e63
--teal-bg:     #f0fdff
--teal-mid:    #cffafe
--amber:       #f59e0b    /* CTA buttons — warm, action-oriented */
--amber-dark:  #d97706
--dark:        #0c1a2e    /* Navy — nav, footer, headings ONLY */
--text:        #1e293b
--muted:       #64748b
--light:       #94a3b8
--bg:          #ffffff
--bg-warm:     #f8fafc
--bg-teal:     #f0fdfa
--border:      #e2e8f0
--border-teal: #a5f3fc
--radius:      14px
--shadow-sm:   0 2px 8px rgba(12,26,46,0.08)
--shadow:      0 8px 32px rgba(12,26,46,0.12)
--shadow-lg:   0 20px 60px rgba(12,26,46,0.18)

/* Airy & Modern palette — active on SSA demo */
--coral:       #EB532F
--coral-dark:  #d4421f
--coral-bg:    #fef3ef
```

### Color Psychology Rules (Research-Backed — Non-Negotiable)

**ALWAYS:**
- White background (`#FFFFFF`) as the dominant hero/section background — 82.5% of top dental sites
- Teal (`#0891b2`) as accent: borders, buttons, eyebrows, credential text
- Amber (`#f59e0b`) for CTA buttons — warm, converts without anxiety
- Aggressive white space — breathing room = calm = trust

**NEVER:**
- Red as a primary color — raises patient anxiety
- Bright yellow as a background
- Dark navy (`#0c1a2e`) as a hero or large section background — cold, clinical, patients avoid it
- Navy belongs ONLY in: footer, nav bar, text, small accents

---

## The 4 Proven Palettes

### Palette 0: "Airy & Modern" ← ACTIVE ON SSA DEMO
*Best for: Oral Surgery, Cosmetic, Premium General Dentistry*
- Background: `#FFFFFF`
- Hero Headline: `#1a2332`
- Italic Accent: `#EB532F` (coral)
- Body Text: `#1C1C1C`
- CTA Button: `#EB532F` with white text
- Ghost Button: Charcoal border + charcoal text
- Eyebrow/Tag: Coral left-border, coral text, all-caps
- Why: White space + unexpected warm coral = fresh, premium, differentiated

### Palette 1: "The Clinical Trust"
*Best for: General Dentistry, Cosmetic, Family*
- Background: `#FFFFFF`
- Primary: `#1B3A5C` or `#2574A9`
- Accent: `#F4F4F4`
- CTA Button: `#F57C00` (warm orange)
- Why: Blue builds trust. White signals hygiene. Orange converts.

### Palette 2: "The Calming Wellness"
*Best for: Pediatric, Holistic, General*
- Background: `#FAFAFA`
- Primary: `#79997C` (sage) or `#244D4D` (deep teal)
- Accent: `#84C5BD`
- CTA Button: `#FFEE84` (soft gold)
- Why: Green lowers heart rate, reduces anxiety — scientifically proven.

### Palette 3: "The Premium Boutique"
*Best for: Oral Surgery, Implants, Prosthodontics, Plastic Surgery*
- Background: `#FFFFFF`
- Primary: `#333333` (warm charcoal)
- Accent: `#A88D6C` (warm taupe)
- CTA Button: `#C5A880` (muted gold)
- Why: Luxury hotel/spa feel. High-revenue specialists.

### Palette by Specialty
| Specialty | Palette |
|-----------|---------|
| Oral Surgery | Palette 0 or 3 |
| General Dentistry | Palette 1 |
| Orthodontics | Palette 1 |
| Pediatric Dentistry | Palette 2 |
| Plastic Surgery | Palette 3 |
| Dermatology | Palette 2 |
| Periodontics | Palette 1 |
| Prosthodontics | Palette 3 |

---

## Typography

### Font Stack
- **Hero H1:** `Playfair Display` (serif) — elegant, luxury. H1 ONLY.
- **Section Headlines H2/H3:** `Cormorant Garamond` (serif) — prestigious, medical
- **Body/UI:** `Inter` (sans-serif) — clean, readable, modern

### Google Fonts Link (Required in every page `<head>`)
```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500&display=swap" rel="stylesheet" />
```

### H1 Specs
```css
font-family: 'Playfair Display', serif;
font-weight: 400;  /* NOT bold */
font-size: clamp(2.8rem, 4.5vw, 4.2rem);
letter-spacing: -0.02em;
```

### Hero Headline Formula (Required)
**[Desired Outcome] + [Italic Differentiator in accent color]**
- "Precision Surgery. *Genuine Compassion.*"
- "Restoring Confidence. *Transforming Lives.*"
- "Exceptional Care. *Exceptional Results.*"
- NEVER: "Welcome to Smith Dental" or generic outcomes

---

## Layout & Spacing

- **Max width:** 1280px, centered
- **Section padding:** 80px–120px vertical
- **Border radius:** 14px (cards, buttons, inputs)
- **Grid:** 12-column. Service cards: 3-col desktop / 2-col tablet / 1-col mobile
- **White space:** Use aggressively. Breathing room = calm = trust.

### Shadows
```css
--shadow-sm: 0 2px 8px rgba(12,26,46,0.08)
--shadow:    0 8px 32px rgba(12,26,46,0.12)
--shadow-lg: 0 20px 60px rgba(12,26,46,0.18)
```

---

## Hero Architecture (LOCKED — Do Not Change Without Tom's Approval)

Full-bleed background photo. White content panel left (56%). Transparent right (44%) shows photo.

```
[  WHITE PANEL 56%  |  PHOTO SHOWS THROUGH 44%  ]
```

**Why:** Any landscape photo displays perfectly. No cropping. Left panel always clean.

**Key rules:**
- `.hero { position: relative; min-height: 90vh; }`
- `.hero-bg { position: absolute; inset: 0; z-index: 0; }`
- `.hero-bg img { width: 100%; height: 100%; object-fit: cover; object-position: center; }`
- `.hero-inner { position: relative; z-index: 1; display: grid; grid-template-columns: 56fr 44fr; }`
- `.hero-content { background: #ffffff; }` — always solid white
- `.hero-photo-side { background: transparent; }` — never change this

**Never:**
- Put a landscape photo inside a portrait-shaped column — it will crop wrong
- Use `display: contents` on hero-content or hero-photo-side

---

## Component Patterns

### Navigation
- White background, sticky top, box-shadow
- Height: 74px
- Logo: image (max-height 52px) OR text fallback (`Cormorant Garamond` name + teal `Inter` subtitle)
- 5 nav links + phone button (outline) + Book button (amber, filled)
- Active page: class `nav-active` — teal color, teal-bg background

### Buttons
```css
/* Primary CTA */
background: var(--amber);
color: #fff;
font-weight: 700;
padding: 10px 22px;
border-radius: 9px;
box-shadow: 0 4px 14px rgba(245,158,11,0.35);

/* Phone/Ghost */
border: 1.5px solid var(--border);
border-radius: 9px;
color: var(--dark);
```

### Cards (Services, Team, Stats)
- Border radius: 14px
- Shadow: `--shadow-sm` default, `--shadow` on hover
- Background: white or `--bg-warm`
- Hover: `translateY(-4px)` lift

### Icons
- Always inline SVG line-art
- NEVER emoji as design elements
- NEVER Font Awesome or external icon fonts

### Topbar
- Background: `--teal-deeper` (`#164e63`)
- Phone: amber/yellow `#fde68a`, font-weight 600
- Links: `rgba(255,255,255,0.7)`

### Footer
- Background: `--dark` (`#0c1a2e`)
- 3-column: Logo+contact | Services links | Practice links
- Bottom bar: copyright + legal links

---

## Animations

### Scroll Reveal
```css
.reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
.reveal.visible { opacity: 1; transform: none; }
```
JS: IntersectionObserver, threshold 0.1

### Stat Counters
```html
<div class="stat-number" data-target="4.9" data-suffix="★">0</div>
```
JS animates 0 → target over ~1.5s on scroll into view.

---

## Mobile

### Breakpoint: 768px
- Nav: hamburger replaces links
- Hero: stacks vertically, full-width photo above content
- Cards: single column

### Mobile Sticky CTA Bar (Required on Every Page)
Fixed bottom bar — 3 equal buttons: **Call | Book | Chat**
- Call → `tel:` link
- Book → `contact.html`
- Chat → `Tawk_API.toggle()`
If no chat: Call + Book split full width.

---

## Page Structure (5 Pages)

Every nav item links to a real page. No anchor-link scrolling between nav items.

| Page | File | Nav Label |
|------|------|-----------|
| Home | index.html | Home |
| Services | services.html | Our Services |
| About | about.html | About Us |
| Team | team.html | Our Team |
| Contact | contact.html | Patient Info |

### Interior Page Hero Pattern
Dark teal background (`--teal-deeper`). Eyebrow + H1 + breadcrumb.

---

## Content Rules

1. No fake data ever. Unverified fields use `[PLACEHOLDER]`.
2. Phone numbers always linked: `tel:+1XXXXXXXXXX`
3. Addresses always linked: `https://maps.google.com/?q=ADDRESS`
4. Doctor names always include full credentials (DMD, MD, FACS, FAACS, etc.)
5. Location count must be accurate
6. Never invent awards, affiliations, or certifications
7. No generic agency language ("innovative solutions", "cutting-edge care")

---

## What Makes This Different From Generic AI Output

- NOT Inter font + purple gradient + card grid — that's the default
- IS Playfair Display + Cormorant Garamond + validated dental color psychology
- Background is always white or near-white (not dark, not dramatic)
- Photos are warm, human, aspirational — never darkened with overlays
- Ego-appropriate copy: credentials front and center, outcome-first headlines
- Every design decision is backed by the Phoenix market audit (April 2026)

---

## Live Demo Reference
**URL:** https://dental-prototype-production.up.railway.app
**Practice:** Scottsdale Surgical Arts — Oral & Maxillofacial Surgery
**Active palette:** Palette 0 (Airy & Modern — coral accent)
**This is the primary sales tool. Every prospect sees this first.**

---

*Point Zero AI · onboarding@pointzeroai.com*
*Last updated: April 2026*
