---
name: vuetify4-components
description: Reference skill for documenting and applying Vuetify 4 components in Vue applications. Use when explaining how a Vuetify 4 component works, choosing props or variants, providing usage examples, or implementing UI with documented Vuetify 4 patterns. Start here for component-specific guidance such as v-btn variants, rounded values, sizes, density, block behavior, and future component references.
metadata:
  genkit-managed: false
---

# Vuetify 4 Components

## Overview

Use this skill as a compact reference layer for Vuetify 4 components in Vue 3 applications.
Prefer the matching file in `references/` for component details and keep this file focused on navigation and maintenance rules.

## Workflow

1. Identify the component the user wants to use or document.
2. Open the matching reference file in `references/`.
3. Extract only the props, examples, and caveats relevant to the request.
4. Preserve the existing project patterns instead of generating generic Vuetify examples when editing a codebase.
5. Verify component API against the official Vuetify documentation when uncertain.

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

## Component References

- `references/v-btn.md`: Button usage, variants, rounded values, block mode, sizes, and density.
- `references/v-dialog.md`: Dialog usage patterns, activator slots, persistent dialogs, nesting, and overflow handling.
- `references/v-divider.md`: Divider usage, variants, inset, gradient, vertical, and content slots.
- `references/v-form.md`: Form validation, rules, validate-on behavior, async validation, and validation states.
- `references/v-text-field.md`: Text field input, variants, labels, placeholders, hints, clearable, and validation.

## Expansion Rules

- Add one reference file per component under `references/`.
- Keep component-specific prop tables and examples in the reference file, not in this root document.
- Reuse the same structure for new component files: overview, key props, examples, and implementation notes.
- Prefer concise Vue examples that can be copied directly into a `<template>`.

## Development Guidelines

1.  **Follow Project Conventions**:
    - Use the existing code style, component structure, and naming patterns.
    - Prefer Composition API with `<script setup>` syntax.
    - Use TypeScript for all component props and state.

2.  **Component Design**:
    - Keep components small and focused on a single responsibility.
    - Use Vuetify's built-in props and slots before creating custom wrappers.
    - Leverage Vuetify's theme system instead of hardcoded colors.

3.  **Best Practices**:
    - Use Vuetify's responsive props (`sm`, `md`, `lg`, etc.) for adaptive layouts.
    - Prefer Vuetify's layout components (`v-container`, `v-row`, `v-col`) for grid-based layouts.
    - Use `v-model` for two-way data binding on form components.
    - Apply accessibility attributes (`aria-label`, `role`) where appropriate.

4.  **Performance**:
    - Use `v-show` instead of `v-if` for frequently toggled elements.
    - Lazy-load heavy components with `defineAsyncComponent` when needed.
    - Avoid unnecessary re-renders by using computed properties and proper reactivity.

## Finding Documentation

Use the official Vuetify documentation for authoritative information:

1.  **Component docs**: https://vuetifyjs.com/en/components/{component-name}/
    - Example: https://vuetifyjs.com/en/components/buttons/
2.  **API reference**: https://vuetifyjs.com/en/api/{component-name}/
    - Example: https://vuetifyjs.com/en/api/v-btn/
3.  **General docs**: https://vuetifyjs.com/en/getting-started/installation/

## References

-   [v-btn Reference](references/v-btn.md): Button component props, variants, and examples.
-   [v-dialog Reference](references/v-dialog.md): Dialog component activator slots, persistent dialogs, nesting, and overflow handling.
-   [v-divider Reference](references/v-divider.md): Divider component variants, inset, gradient, vertical, and content slots.
-   [v-form Reference](references/v-form.md): Form component validation, rules, validate-on behavior, and async validation.
-   [v-text-field Reference](references/v-text-field.md): Text field component input, variants, labels, placeholders, hints, and clearable.
