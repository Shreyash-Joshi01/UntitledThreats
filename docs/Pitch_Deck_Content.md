# Untitled Threats - Pitch Deck Outline

This markdown file provides the content and structure for your Phase 3 Pitch Deck. You can copy this content into PowerPoint, Google Slides, or Canva to create your final presentation.

---

## Slide 1: Title Slide
**Untitled Threats**
*AI-powered parametric income protection for Q-Commerce delivery partners*
**Tagline:** Protecting the invisible losses of the gig economy.

## Slide 2: The Problem
**Invisible Attrition in Q-Commerce**
- **The Context:** Zepto/Blinkit partners earn ₹600–900/day. Earnings are volatile and dependent on daily trips.
- **The Threat:** Uncontrollable external disruptions—Red AQI alerts, heavy rain (35+ mm/hr), curfews, extreme heat (>42°C)—wipe out critical earning hours.
- **The Gap:** Traditional insurance covers hospitalization or bike damage, but ignores actionable income lost to environmental factors.

## Slide 3: The Solution
**100% Parametric Microinsurance**
- **Trigger-based:** Payouts are triggered by data, not individuals. Auto-initiated via weather APIs when conditions cross predefined thresholds.
- **Zero-touch:** No claim filing forms, no wait times.
- **Weekly Subscription:** Dynamic, AI-priced weekly premiums (e.g., ₹39 - ₹99/week) that fit perfectly with weekly payout cycles.

## Slide 4: Application Workflow
**How It Works (End-to-End)**
1. **Onboarding:** Partner registers with Aadhaar + UPI.
2. **AI Risk Profiling:** ML evaluates zone history, active hours, and provides a customized risk premium.
3. **Live Monitoring:** The system continually polls real-time weather and environment APIs.
4. **Trigger & Payout:** If a threshold is crossed (e.g. 3 hrs of AQI > 400), claim is auto-approved and dispenses direct UPI payouts to affected workers dynamically.

## Slide 5: Adversarial Defense & Fraud Guard
**Making parametric payouts bulletproof against spoofing**
- **Behavioral Biometrics:** Verifying motion, acceleration, and GPS metadata.
- **Syndicate Defense:** Stopping coordinated attacks using cell tower clustering, IP subnet analysis, and network anomaly detection.
- **The 'Soft-Hold':** Flagging anomalies immediately without penalizing honest workers; allowing for 1-tap self-attestations or social proof vouching.

## Slide 6: Platform Architecture & Tech Stack
**Modern, Scalable, AI-Driven**
- **Frontend / UX:** React.js PWA, built for low-end devices and poor connectivity.
- **Backend Infrastructure:** Node.js routing + Python ML microservice architecture.
- **AI Integration:** Predictive premium modeling and dynamic fraud scoring (XGBoost / Isolation Forest algorithms).
- **Core APIs:** OpenWeatherMap, IMD alerts mockup, and webhook-driven WhatsApp Notifications.

## Slide 7: Regulatory Stance & Business Model
**Partnering for the Future**
- **B2B2C Model:** Delivered to the gig worker, backed by the balance sheet of licensed IRDAI microinsurers.
- **Phase 1 Sandbox Ready:** Engineered to test the viability of the data layer via IRDAI’s Regulatory Sandbox.
- **Unit Economics:** Small margin on fixed premiums, scaled across thousands of partner delivery nodes automatically.

## Slide 8: What We Delivered (Phase 3)
**Fully Functional Implementations**
- Live Parametric Event triggers hooked up to the real-time UI dashboard.
- Integrated Python ML container scoring risk and generating dynamic premium bands.
- Working Payout Tracker with integrated worker/admin flows.
- Automated WhatsApp communication for immediate worker alerts.

## Slide 9: Thank You / Q&A
**Untitled Threats**
Built for Guidewire DEVTrails 2026.
*[https://github.com/Shreyash-Joshi01/UntitledThreats]
*[https://untitled-threats.vercel.app/]*
