# v-btn

## Overview

Use `v-btn` for primary and secondary actions in Vuetify 4 interfaces.
Choose the variant, size, density, and shape from the interaction intent instead of styling the button ad hoc.

## Variants

The `variant` prop controls the visual style of the button.
Available variants are `elevated`, `flat`, `tonal`, `outlined`, `text`, and `plain`.

| Variant | Meaning |
| --- | --- |
| `elevated` | Default. Elevates the button with a shadow. |
| `flat` | Removes the button shadow. |
| `tonal` | Uses a lower-opacity background based on the current text color. |
| `outlined` | Applies a thin border with the current text color. |
| `text` | Removes the background and shadow. |
| `plain` | Removes the background and lowers the opacity until hover. |

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

## Rounded

Use the `rounded` prop to control border radius.
Common values are `0`, `xs`, `sm`, default, `lg`, and `xl`.

```vue
<template>
  <v-container class="text-center">
    <v-row class="justify-center">
      <v-col cols="12" md="4" sm="6">
        <v-btn rounded="0" size="x-large" block>Rounded 0</v-btn>
      </v-col>

      <v-col cols="12" md="4" sm="6">
        <v-btn rounded="xs" size="x-large" block>Rounded xs</v-btn>
      </v-col>

      <v-col cols="12" md="4" sm="6">
        <v-btn rounded="sm" size="x-large" block>Rounded sm</v-btn>
      </v-col>

      <v-col cols="12" md="4" sm="6">
        <v-btn size="x-large" block>Button</v-btn>
      </v-col>

      <v-col cols="12" md="4" sm="6">
        <v-btn rounded="lg" size="x-large" block>Rounded lg</v-btn>
      </v-col>

      <v-col cols="12" md="4" sm="6">
        <v-btn rounded="xl" size="x-large" block>Rounded xl</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>
```

## Block

Use the `block` prop to make the button expand to the available width.

```vue
<template>
  <v-btn block>Block Button</v-btn>
</template>
```

## Sizes

Use the `size` prop when the button must align with visual hierarchy or available space.
Common values are `x-small`, `small`, default, `large`, and `x-large`.

```vue
<template>
  <div class="d-flex flex-wrap align-center ga-2">
    <v-btn size="x-small">Extra small Button</v-btn>
    <v-btn size="small">Small Button</v-btn>
    <v-btn>Regular Button</v-btn>
    <v-btn size="large">Large Button</v-btn>
    <v-btn size="x-large">X-Large Button</v-btn>
  </div>
</template>
```

## Density

Use the `density` prop to control internal spacing.
Common values are `compact`, `comfortable`, and `default`.

```vue
<template>
  <div class="d-flex flex-wrap ga-2">
    <v-btn density="compact">Compact Button</v-btn>
    <v-btn density="comfortable">Comfortable Button</v-btn>
    <v-btn density="default">Default Button</v-btn>
  </div>
</template>
```

## Implementation Notes

- Prefer `variant` before custom CSS when the goal is purely visual.
- Prefer `block` for stacked mobile layouts or full-width actions inside cards and forms.
- Prefer `rounded` tokens instead of custom border-radius values to stay aligned with Vuetify spacing and shape rules.
- Combine `size` and `density` deliberately. A large button with compact density can look inconsistent unless there is a specific reason.
