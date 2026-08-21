---
name: ui-ux-pro-max
description: "UI/UX design intelligence for web, mobile, and desktop. Use when designing, building, reviewing, or fixing interfaces, including pages, components, design systems, accessibility, interaction, responsive layout, typography, color, charts, and stack-specific UI implementation."
---

# UI/UX Pro Max — Softwall Payroll AI

This project uses the upstream **UI/UX Pro Max** skill by NextLevelBuilder.

## Source

- Upstream repository: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- Upstream skill: `.claude/skills/ui-ux-pro-max`
- Project runtime path: `.agents/skills/ui-ux-pro-max`

## Mandatory UI/UX workflow

For new pages or product-wide visual direction, generate a design system before implementation. For focused UI work, query the relevant UX/style/color/typography/stack guidance first.

Priorities:
1. Accessibility: WCAG AA contrast, keyboard navigation, focus visibility, labels and semantic controls.
2. Touch and interaction: minimum 44×44px targets, adequate spacing, loading/error feedback.
3. Performance: avoid layout shift, lazy-load noncritical media, keep interactions responsive.
4. Style consistency: choose a coherent visual system; do not mix unrelated styles.
5. Responsive layout: mobile-first, no horizontal overflow, predictable breakpoints.
6. Typography and color: readable type scale, semantic tokens, sufficient contrast.
7. Animation: purposeful motion, performant properties, reduced-motion support.
8. Forms and feedback: visible labels, inline errors, useful helper text.
9. Navigation: predictable hierarchy and back behavior.
10. Data visualization: accessible legends/tooltips and do not rely on color alone.

## Softwall Payroll AI stack

Prefer the project's detected stack. The expected primary web stack is Next.js/React/TypeScript with shadcn/ui/Tailwind where present. For mobile, use the project's React Native/Expo implementation where present.

## Runtime search tool

The full upstream database and search script are bootstrapped into this directory by the project's setup script. After bootstrap, use:

```bash
python .agents/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain>
```

For a new page or coherent product visual direction:

```bash
python .agents/skills/ui-ux-pro-max/scripts/search.py "payroll SaaS enterprise HR" --design-system -p "Softwall Payroll AI"
```

For implementation guidance, use the detected stack, for example:

```bash
python .agents/skills/ui-ux-pro-max/scripts/search.py "responsive dashboard accessibility" --stack nextjs
```

Do not fabricate search results. If the search returns zero results, retry once with a narrower query and explicitly label any fallback guidance.

## Bootstrap / refresh

Run the repository bootstrap script from the project root to fetch the current upstream skill assets:

```bash
bash scripts/setup-ui-ux-pro-max.sh
```

Do not install OS packages or modify system configuration as part of this skill. Python 3.x is required for the search scripts.
