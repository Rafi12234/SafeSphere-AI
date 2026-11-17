# Spec 01: Design System & Styling Rules

## 1. Theme: Accessible Teal
- Configured via Accessible Teal shadcn preset (`https://shadcnthemes.com/r/accessible-teal.json`).
- Radius: `--radius: 0.5rem` (8px). Cards use `rounded-lg`, inputs and buttons use `rounded-md`. Never square (`rounded-none`) or pill-shaped.
- Shadows: Near-flat (`shadow-xs` for cards/borders).
- Default mode: `light`. Toggleable to `dark` using `next-themes`.
- Semantic tokens only: `bg-background`, `text-foreground`, `text-muted-foreground`, `bg-card`, `border-border`, `bg-primary`, `text-primary-foreground`. No raw hex codes in components.

## 2. Fonts & Bengali Support
- **Geist Sans & Geist Mono:** Primary UI fonts for English text, code, numbers.
- **Noto Sans Bengali:** Loaded via `next/font/google` and appended to `font-sans`.
- **Bangla Line Height:** Set `leading-relaxed` (approx 1.6) on Bangla text to ensure vowel diacritics and ligatures render without clipping.

## 3. Strict Button Rules (Most Important Visual Rule)
Use stock shadcn `Button`. **Do not restyle it.**
- **Allowed Sizes:** `sm` (h-8), `default` (h-9), `icon` (h-9 w-9), `icon-sm` (h-8 w-8).
- **Prohibited Sizes:** Never use `lg` (h-10+) or custom heights above h-9.
- **Allowed Variants:** `default` (primary), `secondary`, `outline`, `ghost`, `destructive`, `link`.
- **Width:** Buttons must hug their content (`w-auto`). **NEVER use `w-full` anywhere** (not in forms, cards, dialogs, or mobile views). Align or stack instead.
- **Decorations:** No gradients, no glows, no heavy drop shadows, no uppercase text, font weight no greater than `font-medium` (`500`), icons no larger than `size-4` (16px).
- **Hierarchy:** At most one primary (`default`) button per view region. Supporting actions use `outline`, `secondary`, or `ghost`.

### Button Examples
- **Allowed:** `<Button size="sm" variant="default">Start scan</Button>`
- **Allowed:** `<Button size="default" variant="outline">Learn more</Button>`
- **Forbidden:** `<Button className="w-full bg-teal-500 py-4 uppercase">Submit</Button>`
- **Forbidden:** `<Button size="lg">Hero Action</Button>`

## 4. Header Behavior (Landing & App TopBar)
- **Position:** `fixed top-0 inset-x-0 z-50`.
- **Scroll Top (Y = 0):** Background is fully transparent (`bg-transparent`), zero border.
- **Scrolled Past 8px:** Transition over 200ms to `bg-background/60 backdrop-blur-md border-b border-border/50`.
- **Fallbacks:** Provide `-webkit-backdrop-filter` and solid `bg-background/95` fallback if blur is unsupported.
- **Spacing:** Page hero and content must offset with padding (`pt-16` to `pt-20`) so elements never collide with the fixed header.

## 5. Theme Toggle
- Ghost `icon-sm` button (Sun/Moon icons from `lucide-react`).
- Smooth icon cross-fade with 180ms rotation. Persists user preference via `next-themes`.

## 6. Severity & Badge Mapping
Severity colors derived from semantic tokens:
- **Critical:** `destructive` token (`bg-destructive/10 text-destructive border-destructive/20`)
- **High:** `warning` semantic token / orange accent (`bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20`)
- **Medium:** `info` semantic token / blue-teal accent (`bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20`)
- **Low:** `muted` token (`bg-muted text-muted-foreground border-border`)
- **Safe:** `emerald` accent (`bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20`)
