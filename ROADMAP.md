# FeePilot Roadmap to Gold Standard

> **Goal:** Make FeePilot the #1 marketplace fee calculator that every reseller bookmarks, trusts, and recommends.

**Started:** January 14, 2025  
**Last Updated:** January 14, 2025  
**Progress:** 30 / 87 tasks complete

---

## Phase 1: Foundation (Week 1)
*Priority: Fix the fundamentals so users can trust the app.*

### 1.1 Fee Accuracy & Trust
- [x] Research and verify Etsy fees (transaction, payment, listing, offsite ads) ✅ 2025-01-14
- [x] Research and verify eBay fees (category-specific, store vs no-store) ✅ 2025-01-14
- [x] Research and verify Poshmark fees (tiered: $2.95 under $15, 20% over $15) ✅ 2025-01-14
- [x] Research and verify Depop fees (US vs UK differences) ✅ 2025-01-14
- [x] Research and verify Mercari fees (current 2025 rates) ✅ 2025-01-14
- [x] Research and verify StockX fees (seller level tiers 1-4) ✅ 2025-01-14
- [x] Add official source links for each platform's fee page ✅ 2025-01-14
- [x] Update `RULES_UPDATED_AT` with accurate date ✅ 2025-01-14
- [x] Remove "example" comments from fees.ts ✅ 2025-01-14
- [ ] Add fee update verification process documentation

### 1.2 Tiered/Complex Fee Logic
- [x] Implement Poshmark tiered fees ($2.95 under $15, 20% over $15) ✅ 2025-01-14
- [x] Implement eBay category-specific fees ✅ 2025-01-14
- [x] Implement StockX seller level tiers ✅ 2025-01-14
- [x] Implement Etsy offsite ads fee (12-15% when applicable) ✅ 2025-01-14
- [x] Add promoted listings fee option (eBay, Etsy) ✅ 2025-01-14
- [ ] Add payment processing variations by platform

### 1.3 Code Refactoring
- [ ] Split HomeClient.tsx into smaller components
  - [ ] Extract InputsSection component
  - [ ] Extract SummaryCards component
  - [ ] Extract ScenarioPresets component
  - [ ] Extract PlatformSelector component
- [ ] Move fee rules to a separate config/database structure
- [ ] Add TypeScript strict mode improvements
- [ ] Add React error boundaries
- [ ] Add loading states/skeletons

### 1.4 Testing Foundation
- [ ] Set up Jest/Vitest testing framework
- [ ] Write unit tests for fee calculations
- [ ] Write unit tests for formatting functions
- [ ] Write unit tests for CSV export
- [ ] Add GitHub Actions CI for tests

---

## Phase 2: Core Value Enhancement (Weeks 2-3)
*Priority: Make the calculator more useful and trustworthy.*

### 2.1 New Calculator Features
- [ ] Break-even calculator ("minimum price to not lose money")
- [ ] Profit goal solver on main page (not just Pro)
- [ ] Multi-item/bundle calculator
- [ ] "What-if" scenario comparisons
- [ ] Suggested price based on target margin
- [ ] Shipping cost estimator integration

### 2.2 Visual & UX Improvements
- [x] Add item cost input with profit after fees vs net profit display ✅ 2025-01-14
- [x] Add shipping cost input to profit calculation ✅ 2025-01-14
- [x] Add profit indicator colors (green/yellow/red based on margin) ✅ 2025-01-14
- [x] Highlight best platform in comparison table ✅ 2025-01-14
- [x] Add visual fee comparison chart (bar chart) ✅ 2025-01-14
- [x] Improve mobile touch targets and spacing ✅ 2025-01-14
- [x] Add empty state messages with helpful prompts ✅ 2025-01-14
- [x] Add friendly error messages ("Negative profit? Try raising your price!") ✅ 2025-01-14
- [x] Add keyboard shortcuts (Tab navigation, Enter to calculate) ✅ 2025-01-14
- [x] Add calculation animations/transitions ✅ 2025-01-14

### 2.3 Trust & Transparency
- [x] Add "How we calculate" section with formulas shown ✅ 2025-01-14
- [ ] Add expandable breakdown for each fee type
- [x] Add "Last verified" dates per platform ✅ 2025-01-14
- [x] Add tooltips explaining each input field ✅ 2025-01-14
- [x] Add FAQ section ✅ 2025-01-14
- [ ] Add calculator accuracy guarantee statement

### 2.4 Accessibility
- [x] Full ARIA labels audit and fix ✅ 2025-01-18
- [ ] Screen reader testing
- [ ] Keyboard navigation testing
- [x] Color contrast verification ✅ 2025-01-18
- [x] Focus states improvement ✅ 2025-01-18

---

## Phase 3: Growth & Engagement (Month 2)
*Priority: Build audience, capture leads, start monetizing.*

### 3.1 Email & Lead Capture
- [ ] Add email signup for fee update alerts
- [ ] Set up email service (Resend, SendGrid, etc.)
- [ ] Create welcome email sequence
- [ ] Create fee update notification emails
- [ ] Add exit-intent popup (optional)

### 3.2 Pro Features Expansion
- [ ] Bulk/batch pricing calculator (CSV upload)
- [ ] Unlimited saved calculations
- [ ] Custom fee rule overrides
- [ ] Advanced export options (Excel, PDF)
- [ ] Multi-currency support (USD, GBP, EUR, CAD, AUD)
- [ ] Historical calculation history
- [ ] Profit tracking dashboard
- [ ] Tax estimation by US state

### 3.3 Content & SEO
- [ ] Create blog section
- [ ] Write "Complete Guide to [Platform] Fees" for each platform
- [ ] Write "How to Price Items on [Platform]" guides
- [ ] Write "Best Platform for Selling [Category]" comparisons
- [ ] Add structured data (JSON-LD) for rich snippets
- [ ] Optimize meta descriptions per page
- [ ] Create sitemap for blog posts
- [ ] Add internal linking strategy

### 3.4 Monetization
- [ ] Research affiliate programs for each platform
- [ ] Add referral links where appropriate
- [ ] Implement Pro subscription with Stripe
- [ ] Add pricing page
- [ ] A/B test Pro conversion flows
- [ ] Add annual billing option (discount)

---

## Phase 4: Platform & Integrations (Month 3)
*Priority: Connect to real seller data, become indispensable.*

### 4.1 Platform API Integrations
- [ ] Research eBay API (listings, sales data)
- [ ] Research Poshmark API (or scraping alternatives)
- [ ] Research Mercari API options
- [ ] Research Etsy API (OAuth, listings)
- [ ] Build OAuth connection flow
- [ ] Import listings from connected platforms
- [ ] Auto-calculate fees for imported listings
- [ ] Sync sales data for profit tracking

### 4.2 Shipping Integrations
- [ ] Integrate USPS rate calculator
- [ ] Integrate UPS rate calculator
- [ ] Integrate FedEx rate calculator
- [ ] Add Pirate Ship integration
- [ ] Auto-suggest cheapest shipping option
- [ ] Save shipping preferences per user

### 4.3 PWA & Offline
- [ ] Add service worker for offline support
- [ ] Add "Add to Home Screen" prompt
- [ ] Cache fee calculations offline
- [ ] Add push notifications for fee updates
- [ ] Optimize for mobile-first experience

---

## Phase 5: Differentiation & AI (Month 4+)
*Priority: Stand out from competitors with unique features.*

### 5.1 AI-Powered Features
- [ ] AI pricing assistant ("Based on similar items, price at $X")
- [ ] Photo-to-category detection
- [ ] Natural language calculator ("What if I sell this shoe for $150 on eBay?")
- [ ] Smart suggestions based on user patterns
- [ ] Market trend analysis

### 5.2 Advanced Analytics
- [ ] Profit/loss dashboard over time
- [ ] Platform performance comparison (which platform makes you more?)
- [ ] Category analysis (what sells best where?)
- [ ] Seasonal trend insights
- [ ] Tax reporting exports (Schedule C ready)

### 5.3 Community & Social
- [ ] Create Discord server
- [ ] Build Reddit presence (r/Flipping, r/Poshmark, etc.)
- [ ] Add user testimonials section
- [ ] Create referral program
- [ ] Add social sharing with custom images
- [ ] YouTube tutorial videos

### 5.4 Team & Business Features
- [ ] Multi-user accounts
- [ ] Team/VA access controls
- [ ] Business expense tracking
- [ ] Inventory management
- [ ] Consignment tracking
- [ ] White-label/embed options

---

## Completed ✅

*Move items here as they're completed with date:*

<!-- Example:
- [x] Research and verify Etsy fees — completed 2025-01-15
-->

---

## Notes & Decisions

*Document important decisions, blockers, and learnings here:*

### Workflow Notes
<!-- Add your workflow details here -->

### Technical Decisions
<!-- Document architecture choices -->

### Research Links
<!-- Save useful reference URLs here -->

---

## Metrics to Track

| Metric | Current | Target | Notes |
|--------|---------|--------|-------|
| Monthly visitors | ? | 10,000 | Check Plausible/GA |
| Avg session duration | ? | 3+ min | |
| Pro conversions | ? | 2% | |
| Email signups | 0 | 1,000 | |
| Fee accuracy | ~70% | 99% | Audit needed |
| Mobile bounce rate | ? | <50% | |
| Core Web Vitals | ? | All green | |

---

*This roadmap is a living document. Update it as priorities shift and tasks complete.*
