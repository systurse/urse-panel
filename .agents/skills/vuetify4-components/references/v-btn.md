# v-btn

## Overview

Use `v-btn` for primary and secondary actions in Vuetify 4 interfaces.
Choose the variant, size, density, and shape based on the interaction intent instead of styling the button ad hoc.

## Key Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `string` | `'elevated'` | Visual style: `elevated`, `flat`, `tonal`, `outlined`, `text`, `plain` |
| `size` | `string \| number` | `default` | Button size: `x-small`, `small`, `default`, `large`, `x-large` |
| `density` | `string` | `'default'` | Internal spacing: `compact`, `comfortable`, `default` |
| `rounded` | `string \| boolean` | `default` | Border radius: `0`, `xs`, `sm`, `default`, `lg`, `xl`, `pill`, `circle` |
| `block` | `boolean` | `false` | Expands button to full width |
| `color` | `string` | `theme primary` | Button color (supports theme colors) |
| `disabled` | `boolean` | `false` | Disables the button |
| `loading` | `boolean` | `false` | Shows a loading spinner |
| `icon` | `string \| boolean` | `false` | Renders as an icon button |
| `prepend-icon` | `string` | `-` | Adds icon before text |
| `append-icon` | `string` | `-` | Adds icon after text |
| `href` | `string` | `-` | Renders as a link |
| `to` | `string \| object` | `-` | Vue Router target (renders as router-link) |

## Variants

The `variant` prop controls the visual style of the button.

| Variant | When to Use |
| --- | --- |
| `elevated` | Default. Primary actions that need visual emphasis with shadow. |
| `flat` | Secondary actions where shadow is not desired. |
| `tonal` | Subtle emphasis using lower-opacity background based on text color. |
| `outlined` | Borders preferred over filled backgrounds. |
| `text` | Minimal emphasis, removes background and shadow. |
| `plain` | Lowest emphasis, reduces opacity until hover. |

```vue
<template>
  <div class="d-flex flex-wrap ga-2">
    <v-btn variant="elevated">Elevated</v-btn>
    <v-btn variant="flat">Flat</v-btn>
    <v-btn variant="tonal">Tonal</v-btn>
    <v-btn variant="outlined">Outlined</v-btn>
    <v-btn variant="text">Text</v-btn>
    <v-btn variant="plain">Plain</v-btn>
  </div>
</template>
```

## Sizes

Use the `size` prop to align with visual hierarchy.

```vue
<template>
  <div class="d-flex flex-wrap align-center ga-2">
    <v-btn size="x-small">Extra Small</v-btn>
    <v-btn size="small">Small</v-btn>
    <v-btn>Default</v-btn>
    <v-btn size="large">Large</v-btn>
    <v-btn size="x-large">Extra Large</v-btn>
  </div>
</template>
```

## Density

Use the `density` prop to control internal padding.

```vue
<template>
  <div class="d-flex flex-wrap ga-2">
    <v-btn density="compact">Compact</v-btn>
    <v-btn density="comfortable">Comfortable</v-btn>
    <v-btn density="default">Default</v-btn>
  </div>
</template>
```

## Rounded

Use the `rounded` prop to control border radius with Vuetify's shape tokens.

```vue
<template>
  <div class="d-flex flex-wrap ga-2">
    <v-btn rounded="0">Sharp</v-btn>
    <v-btn rounded="xs">XS</v-btn>
    <v-btn rounded="sm">SM</v-btn>
    <v-btn>Default</v-btn>
    <v-btn rounded="lg">LG</v-btn>
    <v-btn rounded="xl">XL</v-btn>
    <v-btn rounded="pill">Pill</v-btn>
    <v-btn icon><v-icon icon="$cancel" /></v-btn>
  </div>
</template>
```

## Block

Use `block` for full-width buttons in cards, forms, or mobile layouts.

```vue
<template>
  <v-btn block>Full Width Button</v-btn>
</template>
```

## Common Patterns

### Icon Button
```vue
<template>
  <v-btn icon>
    <v-icon icon="$delete" />
  </v-btn>
</template>
```

### Button with Icon and Text
```vue
<template>
  <v-btn prepend-icon="$add">
    Add Item
  </v-btn>
</template>
```

### Loading State
```vue
<template>
  <v-btn :loading="isLoading" @click="handleSubmit">
    Submit
  </v-btn>
</template>
```

### Router Link
```vue
<template>
  <v-btn to="/dashboard">
    Go to Dashboard
  </v-btn>
</template>
```

### Disabled State
```vue
<template>
  <v-btn :disabled="!isValid" variant="tonal">
    Save
  </v-btn>
</template>
```

## Implementation Notes

- Prefer `variant` over custom CSS when the goal is purely visual.
- Use `block` for stacked mobile layouts or full-width actions inside cards and forms.
- Use `rounded` tokens instead of custom border-radius values to stay aligned with Vuetify spacing and shape rules.
- Combine `size` and `density` deliberately. A large button with compact density can look inconsistent unless there is a specific reason.
- Use `color` with theme-defined colors (e.g., `primary`, `secondary`, `error`, `success`) for consistency.
- For icon-only buttons, use `icon` prop with a nested `<v-icon>` instead of manual sizing.
- When using with Vue Router, prefer `to` prop over `href` for client-side navigation.
