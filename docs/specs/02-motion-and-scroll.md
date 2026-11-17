# Spec 02: Motion and Scroll Specification

## 1. Smooth Scrolling (Lenis)
- Single global Lenis instance created in `providers/SmoothScrollProvider.tsx`.
- Configuration: `lerp: 0.1`, `wheelMultiplier: 1.0`, smooth touch: `false`.
- RAF-driven with cleanup on unmount.
- Disabled automatically if user agent indicates `prefers-reduced-motion: reduce`.
- **Exclusions:** Add `data-lenis-prevent` to nested scrollable surfaces (modal dialogs, drawers, data tables, code blocks).

## 2. Reusable Scroll Reveals (`<Reveal>`)
- Built using `motion/react`.
- **Default Variant (Vertical Fade-Up):**
  - Initial: `opacity: 0`, `y: 20`
  - Animate: `opacity: 1`, `y: 0`
  - Transition: duration `0.55s`, ease `[0.22, 1, 0.36, 1]`, `viewport: { once: true, margin: "-80px" }`
- **Stagger Variant:**
  - Container orchestrates children with `staggerChildren: 0.06`.
- **Alternating Slide Variant:**
  - For 2-column features: left column enters with `x: -24`, right column with `x: 24`.
- **Constraints:** No bouncy springs, no scale exceeding `1.02`.

## 3. Sticky Scroll Storytelling ("How it Works")
- A tall scroll section (`min-h-[300vh]`) with a `sticky top-24` inner stage.
- Uses Framer Motion's `useScroll` and `useTransform` to track progress across 5 steps:
  1. Connect Facebook Page
  2. Select posts to monitor
  3. Start the simulated scan
  4. Review flagged comments & repeat accounts
  5. Prepare review draft
- Visual transitions between mock interactive states as the user scrolls.
- **Mobile Fallback:** Degrades gracefully into a stacked list of animated reveal cards on screens under `768px`.

## 4. Hero Motion
- Staggered initial entrance on page load (Headline -> Subtitle -> Button group -> Preview mockup).
- Gentle parallax on product preview card (max translation 24px across the viewport).

## 5. Application Motion Budget (Dashboard & Views)
- Restrained and focused on feedback:
  - Subtle page entry fade (150ms).
  - Skeleton shimmer during query loading.
  - Animated progress bar during scan execution.
  - Animated count-up for summary metric numbers.
  - Recharts draw-in animation for charts.
- **Strict Rule:** No scroll-jacking, no parallax, and no disruptive layout shifting inside the dashboard shell.

## 6. Accessibility
- All motion components wrap logic with `useReducedMotion()`. When active, animations instantly resolve without translation or delay (`transition: { duration: 0 }`).
- Animate only GPU-accelerated properties: `opacity` and `transform`.
