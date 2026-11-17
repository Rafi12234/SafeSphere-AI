# Spec 11: QA & Acceptance Checklist

Checklist verified against the completed frontend build:

- [x] **1. Authentication:** Register, login, session survival on page refresh, and logout all work reliably via `react-hook-form` + `zod` and backend httpOnly cookies. Protected routes automatically redirect unauthenticated users to `/login`.
- [x] **2. Facebook Connection Flow:** Connect Facebook round trip operates smoothly. Demo Page mode works when `FACEBOOK_MOCK=true`. Cancelled and error callback states display clear toast feedback.
- [x] **3. Posts Grid & Sync:** Posts load correctly. Latest and older sync actions trigger properly. Checkbox selection and "Select all" update the sticky bottom bar with exact counts. Empty comment badge (`—`) rendered where comments are pending.
- [x] **4. Scan Execution & Animation:** Initiating a scan transitions to `/scans/[id]`. Polling updates the progress bar and cycles through the 4 stages. Moves seamlessly to results without full-page reload.
- [x] **5. Results Presentation:** Summary metric cards, severity bar chart, post breakdown bar chart, filterable comment table, detail drawer, and repeat account cards render accurately.
- [x] **6. Content Shield:** Sensitive abusive text is blurred by default. Individual "Reveal" ghost buttons and global "Reveal all" toggle function without persistence.
- [x] **7. Landing Page Completeness:** Hero, What It Does, Who It's For, Sticky Scroll Storytelling ("How it Works"), Built to Be Careful, FAQ, CTA, and Footer are present with smooth scroll reveals.
- [x] **8. Header Scroll Dynamics:** Header is 100% transparent at scroll Y = 0 and smoothly transitions to translucent backdrop-blurred with border after 8px scroll in both light and dark modes.
- [x] **9. Strict Button Rules:** Every button is stock shadcn `sm` or `default` size with auto width (`w-auto`). Zero instances of `w-full`, `size="lg"`, custom button heights, or pill shapes.
- [x] **10. Color & Theme Tokens:** Accessible Teal tokens used exclusively. Light and dark modes work with no unstyled components or hard-coded hex colors.
- [x] **11. Responsive & Accessibility:** Layouts work down to 375px mobile viewport. Keyboard navigation, visible focus rings, and WCAG AA contrast pass. `prefers-reduced-motion` cleanly disables motion.
- [x] **12. Production Build:** `npm run build` and `tsc` pass with zero type or lint errors (all 11 routes statically rendered and verified).
