---
name: vuetify4-components
description: Reference skill for documenting and applying Vuetify 4 components in Vue applications. Use when the user asks about Vuetify components, needs UI implementations, or encounters component-specific issues. Covers component props, variants, patterns, and best practices for building interfaces with Vuetify 4.
---

# Vuetify 4 Components

## Prerequisites

Before implementing any Vuetify component, verify the environment is properly set up:

1. **Verify Vuetify Installation:**
   Run `grep -q "vuetify" package.json && echo "Vuetify found" || echo "Vuetify not installed"` to check if Vuetify is in the project dependencies.
   - If not installed, add it following the project's package manager:
     ```bash
     yarn add vuetify
     ```

2. **Verify Vuetify Plugin Setup:**
   Check that Vuetify is properly configured in the Vue application:
   - Look for `vuetify` configuration in the main entry file (e.g., `main.ts` or `plugins/vuetify.ts`).
   - Ensure the Vuetify plugin is registered with Vue:
     ```ts
     import { createVuetify } from 'vuetify'
     const vuetify = createVuetify()
     app.use(vuetify)
     ```

3. **Verify TypeScript Configuration:**
   Ensure TypeScript is configured to work with Vuetify:
   - Check `tsconfig.json` or `tsconfig.app.json` includes Vuetify types.
   - Verify `env.d.ts` includes Vuetify component type declarations.

# Vuetify 4 CSS Configuration

## CSS Cascade Layers

Vuetify 4 uses CSS Cascade Layers for style organization. The layer order is critical for styles to work correctly.

### Layer Architecture

```
vuetify-core        → CSS reset, fonts, base styles
vuetify-components  → All component styles (v-btn, v-card, etc.)
vuetify-overrides   → Contextual overrides (.v-dialog > .v-card)
tailwind-theme      → Tailwind theme tokens
tailwind-reset      → Tailwind preflight
vuetify-utilities   → Spacing, display, flex, typography, colors
tailwind-utilities  → Tailwind utility classes
vuetify-final       → Transitions and critical rules
```

### vuetify-utilities Sublayers

The `vuetify-utilities` layer contains nested sublayers in this order:
```
reset → base → display → sizing → spacing → typography → flex → grid → 
positioning → borders → backgrounds → effects → transitions
```

### Critical: Import Order

**`vuetify/styles` MUST be imported before any components or the CSS reset will take precedence and break everything.**

```ts
// plugins/vuetify.ts - CORRECT order
import 'vuetify/styles'           // FIRST
import '@mdi/font/css/materialdesignicons.css'
import '../styles/layers.css'
import { createVuetify } from 'vuetify'
```

### layers.css Configuration

```css
/* src/styles/layers.css */
@layer vuetify-core;
@layer vuetify-components;
@layer vuetify-overrides;

@layer tailwind-theme;
@layer tailwind-reset;

@layer vuetify-utilities;

@layer tailwind-utilities;

@layer vuetify-final;
```

### Enabling Utilities in settings.scss

The `$utilities` setting in `src/styles/settings.scss` controls which utility classes are generated. Setting `$utilities: false` disables ALL Vuetify utilities including spacing classes (`ma-*`, `pa-*`, etc.).

```scss
@use 'vuetify/settings' with (
  $utilities: (
    'spacing': null,    // ma-4, pa-2, mt-6, etc.
    'display': null,    // d-flex, d-block, etc.
    'flex': null,       // flex-column, align-items, etc.
    'typography': null, // text-h1, text-body-1, etc.
    'borders': null,    // rounded, border, etc.
    // ... other utilities
  ),
);
```

## Spacing Utilities

### Syntax

`{property}{direction}-{value}`

| Property | Description |
| --- | --- |
| `m` | Margin |
| `p` | Padding |

| Direction | Description |
| --- | --- |
| `a` | All sides (default, can be omitted) |
| `t` | Top |
| `b` | Bottom |
| `s` | Start (left in LTR) |
| `e` | End (right in LTR) |
| `x` | Horizontal (left + right) |
| `y` | Vertical (top + bottom) |

### Values

| Value | Size |
| --- | --- |
| `0` | 0px |
| `1` | 4px |
| `2` | 8px |
| `3` | 12px |
| `4` | 16px |
| `5` | 20px |
| `6` | 24px |
| `8` | 32px |
| `10` | 40px |
| `12` | 48px |
| `14` | 56px |
| `16` | 64px |
| `auto` | auto |

### Examples

```vue
<!-- Margin all -->
<v-btn class="ma-4">16px margin all sides</v-btn>

<!-- Padding top -->
<v-card class="pt-6">24px padding top</v-card>

<!-- Margin X and Y -->
<div class="mx-2 my-4">8px horizontal, 16px vertical</div>

<!-- Gap (flex children) -->
<div class="d-flex ga-4">16px gap between children</div>
```

## Common CSS Issues

### Spacing Classes Not Working

1. **Check `$utilities` in settings.scss**: If set to `false`, spacing classes are disabled
2. **Check layer ordering**: `vuetify-utilities` must be declared after `vuetify-components`
3. **Check import order**: `vuetify/styles` must be imported before components

### Styles Override Issues

- Custom styles without `@layer` will always override Vuetify's styles
- If Tailwind is loaded before Vuetify layers, Vuetify utilities may be overridden
- Use scoped styles in Vue SFCs carefully - they cannot penetrate Vuetify component boundaries

# Vuetify 4 Usage Principles

Adhere to these principles when working with Vuetify components:

1. **Use Official Documentation:** For any Vuetify component API or behavior, consult the official Vuetify documentation at https://vuetifyjs.com before relying on internal knowledge. Component APIs evolve, and official docs are authoritative.

2. **Follow Agent Skills for Implementation:** Skills provide opinionated workflows and best practices. Always consult the reference files in `references/` to understand *how* to implement components correctly instead of relying on general knowledge.

3. **Prefer Vuetify Props Over Custom CSS:** Use Vuetify's built-in props (`variant`, `color`, `size`, `density`, `rounded`, etc.) before writing custom CSS. This ensures consistency with the design system and theme.

4. **Preserve Existing Project Patterns:** When editing an existing codebase, maintain the established patterns for component structure, naming, and styling. Do not introduce new patterns unless explicitly requested.

5. **Keep Component References Updated:** Since Vuetify best practices and APIs may evolve, remind the user to regularly check for updates to this skill and reference files. If you encounter deprecated props or patterns, follow the migration guidance below.

# Workflow

1. **Identify the Component:** Determine which Vuetify component the user wants to use or document.
2. **Open the Reference File:** Locate and read the matching reference file in `references/`.
3. **Extract Relevant Guidance:** Pull only the props, examples, and caveats relevant to the specific request.
4. **Apply with Context:** Implement the component while preserving existing project patterns and conventions.
5. **Verify Correctness:** After making changes, verify the implementation builds correctly (e.g., `yarn build` or `yarn type-check`).

# Component References

- `references/v-btn.md`: Button usage, variants, rounded values, block mode, sizes, and density.
- `references/v-dialog.md`: Dialog usage patterns, activator slots, persistent dialogs, nesting, and overflow handling.
- `references/v-divider.md`: Divider usage, variants, inset, gradient, vertical, and content slots.
- `references/v-form.md`: Form validation, rules, validate-on behavior, async validation, and validation states.
- `references/v-text-field.md`: Text field input, variants, labels, placeholders, hints, clearable, and validation.

# Expansion Rules

- Add one reference file per component under `references/`.
- Keep component-specific prop tables and examples in the reference file, not in this root document.
- Reuse the same structure for new component files: overview, key props, examples, and implementation notes.
- Prefer concise Vue examples that can be copied directly into a `<template>`.

# Common Issues

- **Component Not Rendering:** Ensure Vuetify is properly initialized in the Vue app and the component is imported (if using treeshaking). Check browser console for warnings.
- **Styles Not Applying:** Verify the Vuetify CSS/SCSS is loaded. Check that custom classes are not overriding Vuetify styles unexpectedly.
- **TypeScript Errors:** If encountering type errors with Vuetify components, ensure `env.d.ts` includes the Vuetify component declarations and `tsconfig.json` references the correct type definitions.
- **Props Not Working:** Double-check prop names and values against the official Vuetify documentation. Some props changed between Vuetify 2 and Vuetify 3/4.

# References

- **Button Component:** See [references/v-btn.md](references/v-btn.md) for `v-btn` variants, sizes, density, and usage patterns.
- **Dialog Component:** See [references/v-dialog.md](references/v-dialog.md) for `v-dialog` activator slots, persistent dialogs, nesting, and overflow handling.
- **Divider Component:** See [references/v-divider.md](references/v-divider.md) for `v-divider` variants, inset, gradient, vertical, and content slots.
- **Form Component:** See [references/v-form.md](references/v-form.md) for `v-form` validation, rules, validate-on behavior, and async validation.
- **Text Field Component:** See [references/v-text-field.md](references/v-text-field.md) for `v-text-field` input, variants, labels, placeholders, hints, and clearable.
- **Official Vuetify Docs:** https://vuetifyjs.com/en/getting-started/installation/
- **Component API Reference:** https://vuetifyjs.com/en/api/ for comprehensive prop and slot documentation.
