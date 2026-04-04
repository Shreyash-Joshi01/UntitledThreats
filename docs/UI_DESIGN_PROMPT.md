# GigShield — UI Design Prompt for Stitch

> **Purpose:** This is the complete visual specification for building GigShield's React frontend
> using Stitch MCP. Every color, font, spacing, and component is explicitly defined.
> Copy this document as the Stitch system prompt before generating any UI.

---

## Project Overview

GigShield is an income protection app for Q-Commerce delivery partners in India (Zepto, Blinkit).
It detects external disruptions (storms, AQI, curfews) via APIs and auto-pays workers instantly.
The audience is delivery partners on low-end Android phones with intermittent connectivity.
The app must feel trustworthy, fast, and simple — like a fintech product, not an insurance form.

---

## Visual Language

### Aesthetic Direction
**Refined Fintech Minimal.** Think: Zepto's app meets a premium neobank.
Clean whites, one strong accent color, generous breathing room, sharp type hierarchy.
No gradients. No glassmorphism. No shadows heavier than 4px. No decorative elements.
Every pixel earns its place. Confidence through restraint.

### Color Tokens

```css
:root {
  /* Base */
  --color-bg:           #FFFFFF;
  --color-bg-subtle:    #F7F8FA;
  --color-bg-muted:     #F0F1F4;
  --color-border:       #E4E6EC;
  --color-border-strong:#C9CDD8;

  /* Text */
  --color-text-primary:   #0D0F14;
  --color-text-secondary: #52576B;
  --color-text-muted:     #8B91A7;
  --color-text-inverse:   #FFFFFF;

  /* Brand Accent — deep electric indigo */
  --color-accent:         #3B5BDB;
  --color-accent-hover:   #2F4AC5;
  --color-accent-light:   #EEF2FF;
  --color-accent-subtle:  #DBEAFE;

  /* Semantic */
  --color-success:        #16A34A;
  --color-success-bg:     #F0FDF4;
  --color-warning:        #D97706;
  --color-warning-bg:     #FFFBEB;
  --color-danger:         #DC2626;
  --color-danger-bg:      #FEF2F2;
  --color-info:           #0284C7;
  --color-info-bg:        #F0F9FF;

  /* Claim Status Colors */
  --color-approved:       #16A34A;
  --color-flagged:        #D97706;
  --color-rejected:       #DC2626;
  --color-pending:        #6366F1;
}
```

### Typography

```css
/* Import in index.html or index.css */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&display=swap');

:root {
  --font-sans:  'DM Sans', -apple-system, sans-serif;
  --font-mono:  'DM Mono', monospace;

  /* Scale */
  --text-xs:    0.75rem;    /* 12px */
  --text-sm:    0.875rem;   /* 14px */
  --text-base:  1rem;       /* 16px */
  --text-lg:    1.125rem;   /* 18px */
  --text-xl:    1.25rem;    /* 20px */
  --text-2xl:   1.5rem;     /* 24px */
  --text-3xl:   1.875rem;   /* 30px */
  --text-4xl:   2.25rem;    /* 36px */

  /* Weight */
  --weight-regular: 400;
  --weight-medium:  500;
  --weight-semibold:600;
  --weight-bold:    700;
}
```

### Spacing Scale

```css
:root {
  --space-1:  0.25rem;   /* 4px */
  --space-2:  0.5rem;    /* 8px */
  --space-3:  0.75rem;   /* 12px */
  --space-4:  1rem;      /* 16px */
  --space-5:  1.25rem;   /* 20px */
  --space-6:  1.5rem;    /* 24px */
  --space-8:  2rem;      /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */
}
```

### Border Radius

```css
:root {
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   14px;
  --radius-xl:   20px;
  --radius-full: 9999px;
}
```

### Shadows

```css
:root {
  --shadow-xs: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-sm: 0 1px 4px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.08);
}
```

---

## Layout System

### Mobile-First Grid
- Max content width: 480px (centered on desktop, full-bleed on mobile)
- Horizontal padding: 20px (--space-5) on mobile, 24px on tablet+
- Bottom navigation height: 64px (fixed, always visible when authenticated)
- Top header height: 56px (fixed)
- Safe area: use `padding-bottom: env(safe-area-inset-bottom)` on bottom nav

### Page Wrapper
```jsx
// Every page wraps in this
<div className="page-wrapper">
  {/* content */}
</div>

// CSS
.page-wrapper {
  min-height: 100dvh;
  background: var(--color-bg);
  max-width: 480px;
  margin: 0 auto;
  padding: var(--space-5);
  padding-top: calc(56px + var(--space-5));     /* account for header */
  padding-bottom: calc(64px + var(--space-8));  /* account for bottom nav */
}
```

---

## Component Specifications

### Button

```jsx
// Variants: primary | secondary | ghost | danger
// Sizes: sm | md | lg

// Primary
.btn-primary {
  background: var(--color-accent);
  color: var(--color-text-inverse);
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  padding: 14px var(--space-6);
  width: 100%;           /* full-width by default on mobile */
  cursor: pointer;
  transition: background 150ms ease;
}
.btn-primary:hover { background: var(--color-accent-hover); }
.btn-primary:disabled { background: var(--color-border); color: var(--color-text-muted); cursor: not-allowed; }

// Secondary
.btn-secondary {
  background: var(--color-bg);
  color: var(--color-accent);
  border: 1.5px solid var(--color-accent);
  border-radius: var(--radius-md);
  font-weight: var(--weight-semibold);
  padding: 13px var(--space-6);
}

// Ghost
.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border: none;
  padding: var(--space-3) var(--space-4);
  font-weight: var(--weight-medium);
}
```

### Card

```jsx
.card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-xs);
}

.card-muted {
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}
```

### Input

```jsx
.input {
  width: 100%;
  background: var(--color-bg);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--color-text-primary);
  padding: 14px var(--space-4);
  outline: none;
  transition: border-color 150ms ease;
}
.input:focus { border-color: var(--color-accent); }
.input::placeholder { color: var(--color-text-muted); }
.input.error { border-color: var(--color-danger); }
```

### OTP Input (6 boxes)

```jsx
// 6 individual single-character inputs
// Box size: 48px × 56px
// Font: var(--font-mono), var(--text-xl), var(--weight-semibold)
// Gap between boxes: var(--space-2)
// Active box border: var(--color-accent) 2px
// Filled box background: var(--color-accent-light)
```

### Badge

```jsx
// Claim status badges
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 4px var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.badge-approved  { background: var(--color-success-bg); color: var(--color-success); }
.badge-flagged   { background: var(--color-warning-bg); color: var(--color-warning); }
.badge-rejected  { background: var(--color-danger-bg);  color: var(--color-danger);  }
.badge-pending   { background: var(--color-accent-light); color: var(--color-accent); }
.badge-active    { background: var(--color-success-bg); color: var(--color-success); }
```

### Bottom Navigation

```jsx
// 4 tabs: Dashboard | Policy | Premium | Claims
// Fixed bottom, full width, max-width 480px centered
// Height: 64px + safe-area-inset-bottom
// Background: white with top border 1px var(--color-border)
// Active tab: icon + label in var(--color-accent), bold
// Inactive tab: var(--color-text-muted), regular
// Icons: use react-icons/ri (Remix Icons) — outline when inactive, fill when active
```

### Spinner

```jsx
// 24px circular spinner
// Border: 2px solid var(--color-border)
// Border-top: 2px solid var(--color-accent)
// Animation: spin 0.7s linear infinite
```

### Event Alert Banner

```jsx
// Shown on dashboard when active parametric event in worker's zone
// Full-width, just below header
// Background: var(--color-warning-bg)
// Left border: 3px solid var(--color-warning)
// Icon: ⚠️ or weather icon (RiRainyLine etc)
// Text: "Heavy Rain Alert · ₹350 protection active"
// Font: var(--text-sm), var(--weight-medium)
// Padding: var(--space-3) var(--space-4)
```

---

## Page-by-Page UI Plan

### Page 1 — Onboarding (4 steps, single page)

**Step 1: Phone Entry**
- Full-height centered layout
- GigShield logo (text mark: "GigShield" in DM Sans Bold, --color-accent) at top center, 48px
- Subheading: "Income protection for delivery partners" in --text-sm, --color-text-secondary
- 32px gap
- Label: "Mobile number" --text-sm --weight-medium
- Phone input with +91 prefix (grey box, --color-bg-muted, non-editable, left-side of input)
- 10-digit numeric keyboard on mobile
- Full-width primary button: "Send OTP"
- Bottom text: "By continuing, you agree to our Terms" --text-xs --color-text-muted centered

**Step 2: OTP Verification**
- Back arrow top left
- Heading: "Enter OTP" --text-2xl --weight-bold
- Subtext: "Sent to +91 XXXXXX1234" --text-sm --color-text-secondary
- 6-box OTP input (centered)
- 16px gap
- Full-width primary button: "Verify"
- Resend link: "Resend in 30s" → becomes "Resend OTP" as tap target after timer

**Step 3: Profile Setup**
- Progress indicator: 3 dots, step 3 filled in --color-accent
- Heading: "Set up your profile"
- Form fields stacked with 16px gap:
  - Partner ID (text input, placeholder "Your Zepto/Blinkit ID")
  - Platform selector (2 toggle buttons: "Zepto" | "Blinkit" | "Both" — selected = accent filled)
  - Zone / Pin Code (numeric input, placeholder "400001")
  - UPI ID (text input, placeholder "name@upi")
  - Weekly working hours (number input, default 40)
- Full-width primary button: "Continue"

**Step 4: Done**
- Centered, full-height
- Large checkmark icon in --color-success, 64px
- Heading: "You're protected" --text-3xl --weight-bold
- Subtext: "Your weekly policy is active." --color-text-secondary
- Premium card: card-muted, shows "₹59 / week" large, "Coverage up to ₹1,800" below
- Full-width primary button: "Go to Dashboard"

---

### Page 2 — Dashboard

**Header (fixed)**
- Left: "GigShield" logotype --text-lg --weight-bold --color-accent
- Right: Avatar circle (initials from partner ID), 36px, --color-accent-light bg

**Content (scrollable)**
- If active event in zone: EventAlertBanner (see component spec)
- 20px gap
- Section: "This Week" label --text-xs --weight-semibold --color-text-muted uppercase
- Policy status card (card, full-width):
  - Top row: "Active Policy" badge-active | "Renew in 3 days" --text-xs --color-text-muted right
  - Middle: "₹59" --text-3xl --weight-bold left | "/week" --text-sm --color-text-muted
  - Bottom row: "Coverage up to ₹1,800 · Zone 400001" --text-sm --color-text-secondary
- 20px gap
- Section: "Recent Payouts"
- If no claims: empty state — icon (RiMoneyRupeeCircleLine) 40px --color-border, text "No payouts yet. We've got you covered." --color-text-muted --text-sm centered
- If claims exist: last 2 ClaimCards (see below)
- "View all →" text link right-aligned --text-sm --color-accent

---

### Page 3 — Policy Management

**Header:** "My Policy" --text-xl --weight-bold

**Active Policy Card (accent bordered):**
- Border: 2px solid var(--color-accent)
- Badge: "ACTIVE" top-right
- Premium: "₹59" --text-4xl --weight-bold + "/week" --text-base --color-text-secondary
- Divider line (--color-border)
- 2-column detail grid:
  - "Coverage" → "₹1,800"
  - "Zone" → "400001 · Mumbai"
  - "Renews" → "Mon, Apr 7"
  - "Eligible for claims" → "✓ Yes" (green) or "2 weeks needed" (amber)
- Divider
- "Payout Tiers" section heading --text-sm --weight-semibold
- 6 payout tier rows, each:
  - Left: event name + icon
  - Right: payout amount in --color-accent --weight-semibold
  - Separated by --color-border 1px line

**Renewal Section:**
- card-muted, 20px margin-top
- "Next week's premium: ₹59" --text-lg --weight-semibold
- "Auto-renews every Monday" --text-sm --color-text-muted
- Secondary button: "Manage Renewal"

---

### Page 4 — Premium Calculator

**Header:** "Premium Calculator" --text-xl --weight-bold

**Input Card:**
- Zone code input (pre-filled from worker profile, editable)
- Weekly hours slider: 20–70hrs, step 5, thumb in --color-accent
  - Label shows current value: "45 hrs/week"
- Full-width primary button: "Calculate Premium"

**Results Card (shown after calculation):**
- "Your Weekly Premium" --text-sm --weight-medium --color-text-muted
- Premium amount: "₹72" --text-4xl --weight-bold --color-accent
- Divider
- "Adjustment Breakdown" --text-sm --weight-semibold
- Factor rows (each):
  - Left: Factor name (e.g. "Zone Risk Score")
  - Right: adjustment "+₹15" in --color-danger or "−₹8" in --color-success or "₹0"
- Divider
- "Base premium: ₹59 · Multiplier: 1.22×" --text-xs --color-text-muted
- Divider
- "Max weekly payout: ₹1,800" --text-sm --weight-medium
- Full-width primary button: "Activate This Policy"

**If ML service unavailable:**
- Same layout, small info banner at top of results: "ℹ️ Using standard pricing (ML service warming up)"

---

### Page 5 — Claims Management

**Header:** "Claims" --text-xl --weight-bold

**Filter tabs (horizontal scroll, no overflow indicator):**
- "All" | "Approved" | "Pending" | "Flagged" | "Rejected"
- Active tab: pill with --color-accent bg, white text
- Inactive: text only, --color-text-muted

**ClaimCard (per claim, card):**
- Top row: event type icon (weather icon) + event label left | payout amount right --weight-bold
- Second row: zone code + triggered time --text-xs --color-text-muted
- Third row: status badge left | "Paid via UPI" --text-xs --color-text-muted right (if approved)
- Bottom (if flagged): amber banner "Under review · Tap to respond" + tap target

**Empty state (no claims):**
- Shield icon 48px --color-border center
- "No claims yet" --text-base --weight-medium
- "When disruptions hit your zone, we auto-pay you." --text-sm --color-text-muted

**Individual Claim Page (/claims/:id):**
- Back arrow
- Status icon large (64px): ✓ green / ⏳ amber / ✗ red
- Payout amount --text-4xl --weight-bold centered
- Event name + timestamp centered --text-sm --color-text-muted
- card-muted: timeline
  - Event detected → Claim initiated → Fraud check passed → Paid
  - Each step: dot + label + timestamp
- If flagged: card with amber border
  - "Your claim is under review"
  - "Confirm you were working in Zone 400001 during this event" --text-sm
  - "Yes, I was working" primary button
  - "I disagree with rejection" ghost button (shows if rejected)

---

## Build Instructions for Stitch

1. Set up project with React + Vite + Tailwind CSS
2. Configure CSS variables in `src/styles/theme.css` using ALL tokens above
3. Import DM Sans + DM Mono from Google Fonts in `index.html`
4. Build `src/components/ui/` first: Button, Card, Badge, Input, OTPInput, Spinner
5. Build `src/components/layout/`: BottomNav (4 tabs), PageWrapper
6. Build `src/components/shared/`: EventAlertBanner, ClaimCard, PayoutTimeline
7. Build pages in order: Onboarding → Dashboard → Policy → Premium → Claims
8. All pages must be fully responsive: test at 375px (iPhone SE) and 390px (iPhone 14)
9. Bottom navigation is always visible on authenticated pages (Policy, Premium, Claims, Dashboard)
10. Onboarding pages have NO bottom navigation
11. Use `react-router-dom` v6 for routing
12. Use `react-icons/ri` for all icons (Remix Icons set — consistent outline/fill pair)
13. No external component libraries (no shadcn, no MUI, no Chakra) — all components custom
14. No gradients anywhere — flat color only
15. Transitions: 150ms ease on interactive elements only (hover, focus, active states)
16. All monetary values formatted with `formatINR()` utility — never raw numbers in JSX
17. Mobile keyboard: set `inputMode="tel"` on phone/OTP inputs, `inputMode="numeric"` on PIN code

---

## Icon Reference (react-icons/ri)

```
Dashboard:    RiHomeLine / RiHomeFill
Policy:       RiShieldLine / RiShieldFill
Premium:      RiCalculatorLine / RiCalculatorFill
Claims:       RiFileListLine / RiFileListFill
Rain:         RiRainyLine
Heat:         RiSunLine
AQI:          RiWindyLine
Flood:        RiFloodLine
Curfew:       RiAlertLine
Approved:     RiCheckboxCircleLine (green)
Flagged:      RiErrorWarningLine (amber)
Rejected:     RiCloseCircleLine (red)
Rupee:        RiMoneyRupeeCircleLine
Back:         RiArrowLeftLine
```
