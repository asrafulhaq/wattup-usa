# WattUp USA — Consolidated Feedback & Action Items

> Work through these tasks one section at a time. Check off each item as it's completed.

---

## Status Legend
- `[ ]` Not started
- `[~]` In progress
- `[x]` Done
- `[?]` Blocked — needs clarification

---

## Section 1 — Homepage Updates

- [ ] **1.1** Replace "Find a Charger" button text → "Explore Our Growing Network"
  - File: `components/home/hero.tsx` (~line 43)
  - Link stays the same: `/locations`

---

## Section 2 — Locations Page Updates

- [ ] **2.1** Replace subtitle with new institutional copy
  - New text: *"WattUpUSA is strategically expanding its ultra-fast EV charging network throughout California's high-traffic retail and commercial corridors through a disciplined deployment strategy focused on long-term infrastructure growth."*
  - Remove the "Additional locations…" sentence entirely
- [ ] **2.2** Replace all "Coming Soon" labels → "Active Market Expansion"
  - Apply to all location cards consistently

---

## Section 3 — FAQ Category Restructure

Remove old categories:
- [ ] **3.1** Remove: `Order`
- [ ] **3.2** Remove: `Incentives`
- [ ] **3.3** Remove: `Preparing for Delivery`

Add new categories (in order):
- [ ] **3.4** Add: `Driver Questions`
- [ ] **3.5** Add: `Charging & Compatibility`
- [ ] **3.6** Add: `Sustainability`
- [ ] **3.7** Add: `Property Owners & Partners`

---

## Section 4 — FAQ Copy Revisions

### Driver Questions
- [ ] **4.1** How do I start charging?
  > Park at an available WattUp station, plug your vehicle in, and follow the on-screen prompts or use the WattUp app to start charging. Once your session is authorized, charging begins automatically.

- [ ] **4.2** Do I need an app?
  > No. You can charge directly using contactless payment methods, including major credit cards, Apple Pay, Google Pay, and RFID options. The WattUp app simply provides additional features like station locations, charging history, and live status updates.

- [ ] **4.3** How long does charging take?
  > Charging speed depends on your vehicle, battery size, and current charge level. WattUp ultra-fast DC charging stations deliver up to 300+ kW, allowing many compatible EVs to charge from approximately 10% to 80% in as little as 15–30 minutes.

- [ ] **4.4** How much does it cost to charge?
  > Pricing varies by location and local utility conditions. WattUp offers transparent pay-as-you-go pricing with no hidden monthly fees. Exact pricing will be displayed before you begin charging.

- [ ] **4.5** Can I charge in bad weather?
  > **Keep existing answer as-is — no change.**

- [ ] **4.6** How do I find a WattUp station near me?
  > You can explore current and upcoming WattUp locations using the interactive map on our website. As our network grows, live availability and additional driver features will also be accessible through the WattUp app.

### Charging & Compatibility
- [ ] **4.7** What vehicles are compatible?
  > WattUp stations are designed for broad compatibility and support major charging standards, including CCS, NACS/Tesla, and J1772 where available. Compatibility may vary by location and charger type.

- [ ] **4.8** How does battery-integrated charging help the grid?
  > Our battery-integrated charging systems help reduce stress on the electrical grid by storing energy and delivering power when needed. This can improve charging performance, lower demand costs, and support more reliable operation during peak periods.

### Sustainability
- [ ] **4.9** Is WattUp powered by clean energy?
  > Sustainability is central to our mission. WattUp is focused on expanding EV infrastructure and supporting a cleaner transportation future through efficient charging technology and smart energy solutions.

### Property Owners & Partners
- [ ] **4.10** What solutions do you offer commercial property owners?
  > WattUp USA provides fully managed EV charging solutions with no upfront cost to qualified property owners. We handle site analysis, engineering, permitting, utility coordination, installation, and ongoing operations while creating a long-term revenue opportunity for your property.

- [ ] **4.11** How can my business apply to host a WattUp station?
  > Own or manage a high-traffic retail center, restaurant, grocery location, or commercial property? Contact our team through the Partner With Us section to see if your property qualifies for a fully managed WattUp installation.

- [ ] **4.12** How can I contact you?
  > Need help? Contact us anytime for driver support, general questions, or partnership opportunities at support@wattupusa.com or through our contact form below. Our support team is available for urgent assistance.

---

## Section 5 — Terms of Use & Privacy Policy Pages

- [?] **5.1** Create dedicated `/terms` page with Terms of Use content
- [?] **5.2** Create dedicated `/privacy-policy` page with Privacy Policy content
- [ ] **5.3** Update footer links to point to the new dedicated pages
- [ ] **5.4** Review/update existing `/policy` page — keep, replace, or redirect?

---

## Open Questions

| # | Question | Status |
|---|----------|--------|
| Q1 | **Legal content:** The feedback doc references "linked legal documents/files" for Terms of Use and Privacy Policy — those weren't attached. Can you share or paste the content for both pages? | Waiting |
| Q2 | **Existing `/policy` page:** There's already a policy page with some content (`PolicyOptionsData`, `PolicyLeagalsData`). Should the new dedicated pages replace it, or live alongside it? | Waiting |
| Q3 | **"Coming Soon" source:** Need to confirm where these labels are rendered (component vs. data layer) before updating. Should I dig into this before we start? | Waiting |

---

## Suggested Order of Work

1. **Start here →** Section 1 (Homepage CTA) — simplest, one line change
2. Section 3 + 4 (FAQ full overhaul) — self-contained, no blockers
3. Section 2 (Locations subtitle + status labels) — needs Q3 resolved
4. Section 5 (Legal pages) — blocked on Q1 and Q2
