# TRAVELISER 🏔️✈️🛡️

> **India's Premier Adventure Travel & Safety Platform**  
> Inspired by MakeMyTrip and Goibibo, powered by **SAHAYAKMITR.ai** (Google Gemini 3.5 Generative Intelligence) and an integrated **24x7 Women Safety & Emergency Protection Command Center**.

---

## ✨ Features & Architecture

1. **MakeMyTrip-Inspired Booking & Search Matrix**:
   - Ultra-fast, clean 4-parameter search bar: *From, To, Departure Date, Duration / Travellers*.
   - Instant swap, smart city selector chips, and flexible fare classes (Regular, Student, Senior Citizen, Armed Forces).
   - Minimalist category navigation for Mountain Passes, Luxury Stays, Scenic Trains, Intercity Cabs, and Trekking Trails.

2. **SAHAYAKMITR.ai Generative Copilot**:
   - Integrated Google Gemini 3.5 AI multi-feature assistant.
   - Live altitude-aware itinerary architecting with daily schedules, acclimatization milestones, and budget breakdowns.
   - Interactive chat recommendations, one-click prompts, and quick action chips.

3. **24x7 Women Safety & Emergency Command Center**:
   - **Tactical Dark Security Center**: Dedicated high-contrast command dashboard.
   - **Live Radar Simulation**: Real-time high-altitude patrol tracking with beacon sweeps and telemetry coordinate feeds.
   - **Satellite SOS & Police Dispatch Relay**: Direct cellular & satellite relay to nearest PCR units (112 integration).
   - **Lost & Found Recovery Network**: SafeTag QR registration and instant item tracing.
   - **High-Altitude Specialist Directory**: Verified doctors, recovery mechanics, and mountain guides.

4. **Food Inspection Department**:
   - Food safety inspection audits with star ratings and hygienic kitchen certification.
   - Criteria-based dietary recommendations (Preferred vs. Non-Preferred regional foods).
   - Gemini AI Live Food Safety Inspector widget for instant culinary advisories.

5. **Firebase Web Authentication**:
   - Powered by Firebase (`travelfier`).
   - One-click Google Sign-In, Email/Password authentication, and Instant Guest Explorer access.
   - Member Passport profile modal with saved plans counter and synchronized user session.

6. **YOUR PLANS (E-Commerce Style Drawer)**:
   - Dedicated floating corner drawer to view and manage saved itineraries.
   - Instant expedition checkout modal with transparent pricing breakdown and booking vouchers.

---

## 🚀 Live Deployment on Vercel

This repository is pre-configured for instant zero-configuration deployment on [Vercel](https://vercel.com):

### Quick Deploy via Vercel Dashboard:
1. Log in to [Vercel](https://vercel.com).
2. Click **"Add New..."** → **"Project"**.
3. Import your GitHub repository: `https://github.com/ajinkyadongre1/TRAVELISER.git`.
4. Keep the **Framework Preset** as **Other** (or Auto-detected).
5. The included `vercel.json` and `package.json` automatically handle routing, caching, and security headers.
6. Click **Deploy**! Your site will be live on an ultra-fast global edge network in seconds.

---

## 💻 Local Development

Run locally using Python or any static web server:

```bash
# Using Python
python -m http.server 8080

# Or using Node.js npx
npx serve .
```

Then visit: [http://localhost:8080](http://localhost:8080) in your web browser.

---

## 🔐 Configuration & Keys

- **Firebase Web App**:
  - Project ID: `travelfier`
  - Auth Domain: `travelfier.firebaseapp.com`
  - Handled via Firebase SDK v10 in `app.js` and `index.html`.
- **Google Gemini AI Studio API**:
  - Pre-configured with automatic multi-model failover (`gemini-flash-lite-latest`, `gemini-flash-latest`, `gemini-2.5-flash-lite`).
  - Supports custom API key override via the Gemini AI status modal in the web interface.

---

## 📄 License & Credits

© 2026 Traveliser Technologies India Pvt. Ltd. All rights reserved.  
Traveliser (formerly Margify) and SAHAYAKMITR.ai are registered trademarks.
