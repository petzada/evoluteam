# Evoluteam Landing Page Redesign Spec

## Context
Refactoring the landing page to apply the design system concepts from `DESIGN.md` while preserving the existing copy and the characteristic serif typography of the brand.

## Visual Direction
**Hybrid Approach**:
- Maintain the current serif typography (`font-serif-landing`) for headings and italic emphasis to keep the brand's identity.
- Adopt `DESIGN.md` tokens for structural elements: colors, spacing rhythm, button shapes, and background surfaces.

## Section Rhythm & Signature Surfaces
The page will implement the "Contraste Intercalado" (Interleaved Contrast) rhythm to manage visual energy according to `DESIGN.md`:

1. **Hero Section**: `canvas` (White #ffffff) background.
2. **Pain Points ("A planilha é só o sintoma")**: `signature-coral` (#aa2d00) full band. Text will be `on-dark` (#ffffff).
3. **Flow Steps ("Como funciona")**: `canvas` (White #ffffff) background.
4. **Features (3 blocks)**:
   - Feature 1 ("CONTÍNUO"): `signature-cream` (#f5e9d4) background to act as a soft callout.
   - Feature 2 ("FORMAL"): `canvas` (White #ffffff) background.
   - Feature 3 ("AÇÃO"): `surface-dark` (#181d26) background.
5. **Founder Letter**: `canvas` (White #ffffff) background.
6. **Demo / Footer**: `surface-dark` (#181d26) for the demo CTA, followed by standard white footer.

## Components Changes
1. **Buttons (CTAs)**:
   - Update `CtaLink` component.
   - `variant="dark"` uses `{colors.primary}` (`#181d26`) and `{colors.on-primary}` (`#ffffff`).
   - Use `{rounded.lg}` (approx `rounded-xl` in Tailwind, e.g., 12px) for primary buttons instead of small rounding.
   - Remove any pill-shaped rounding (unless for pricing specifically).
2. **Spacing**:
   - Update `sectionClass` padding to reflect `{spacing.section}` (96px/120px) where appropriate.
3. **Colors**:
   - Strip `#fcf8f8` backgrounds in favor of strict `#ffffff` (canvas).
   - Ensure text colors use `ink` (`#181d26`), `body` (`#333840`), or `muted` (`#41454d`) on light surfaces.

## Implementation Notes
- Modify `src/features/landing/LandingPage.tsx` and related sub-components (`CtaLink`, `SectionIntro`, `FeatureSection`).
- Update Tailwind classes to match the new color hexes and border-radii directly or map them in `tailwind.config.ts` if needed (we'll use arbitrary values `bg-[#aa2d00]` for direct token translation to avoid config bloat for a single page).
- Ensure accessible contrast on the new Coral and Dark sections.
