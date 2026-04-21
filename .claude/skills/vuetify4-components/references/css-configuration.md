# CSS Configuration

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

### Critical: Import Order

**`vuetify/styles` MUST be imported before any components or the CSS reset will take precedence and break everything.**

```ts
// plugins/vuetify.ts - CORRECT order
import 'vuetify/styles'           // FIRST
import '@mdi/font/css/materialdesignicons.css'
import '../styles/layers.css'
import { createVuetify } from 'vuetify'
```

### Enabling Utilities in settings.scss

The `$utilities` setting in `src/styles/settings.scss` controls which utility classes are generated. Setting `$utilities: false` disables ALL Vuetify utilities including spacing classes (`ma-*`, `pa-*`, etc.).

```scss
@use 'vuetify/settings' with (
  $utilities: (
    'spacing': null,    // ma-4, pa-2, mt-6, etc.
    'display': null,    // d-flex, d-block, etc.
    'flex': null,       // flex-column, align-items, etc.
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
