# v-divider

## Overview

Use `v-divider` to separate sections of lists or layouts.
Dividers in their simplest form display a horizontal line and help organize content visually.

## Key Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `vertical` | `boolean` | `false` | Renders a vertical divider instead of horizontal |
| `inset` | `boolean` | `false` | Indents the divider 72px to align with list items |
| `thickness` | `string \| number` | `1` | Thickness of the divider line in pixels |
| `opacity` | `string \| number` | `0.12` | Opacity of the divider (0-1) |
| `color` | `string` | `currentColor` | Color of the divider |
| `gradient` | `boolean` | `false` | Enables a fading gradient effect |
| `variant` | `string` | `'solid'` | Line style: `solid`, `dashed`, `dotted` |
| `content-offset` | `string \| number \| array` | `-` | Offset for content placed inside the divider |

## Slots

| Slot | Description |
| --- | --- |
| `default` | Content to display within the divider (text, icons, avatars) |

## Basic Usage

### Horizontal Divider

```vue
<template>
  <v-divider></v-divider>
</template>
```

### Vertical Divider

```vue
<template>
  <div class="d-flex align-center ga-4">
    <span>Left content</span>
    <v-divider vertical></v-divider>
    <span>Right content</span>
  </div>
</template>
```

## Variants

### Solid (Default)

```vue
<template>
  <v-divider></v-divider>
</template>
```

### Dashed

```vue
<template>
  <v-divider variant="dashed"></v-divider>
</template>
```

### Dotted

```vue
<template>
  <v-divider variant="dotted"></v-divider>
</template>
```

## Gradient

Enable a fading gradient effect for a modern look.

```vue
<template>
  <v-divider color="red" opacity=".7" thickness="3" gradient></v-divider>
  <v-divider opacity=".7" thickness="3" gradient>OR</v-divider>
</template>
```

## Inset

Inset dividers are moved 72px to the right to align with list items.

```vue
<template>
  <v-list>
    <v-list-item title="Item 1" />
    <v-divider inset></v-divider>
    <v-list-item title="Item 2" />
  </v-list>
</template>
```

## Content Slot

Place content between divider sections using the default slot.

```vue
<template>
  <v-container class="d-flex flex-column gr-4">
    <v-divider content-offset="2rem" opacity=".7" thickness="5" variant="dotted" gradient>
      CHAPTER 1.4
    </v-divider>

    <v-divider :content-offset="[40, -1.5]" opacity=".7" thickness="2" variant="dashed">
      ∞
    </v-divider>

    <v-divider :content-offset="[12, 2.5]" opacity=".7">
      * * *
    </v-divider>

    <v-divider color="primary" content-offset="-16" opacity="1" style="color: inherit" thickness="1">
      <v-avatar class="border border-primary border-opacity-100" icon="mdi-chevron-down" size="36"></v-avatar>
    </v-divider>
  </v-container>
</template>
```

## Common Patterns

### List Separator

```vue
<template>
  <v-list>
    <v-list-item v-for="item in items" :key="item.id" :title="item.title" />
    <v-divider v-if="showMore" />
    <v-list-item v-if="showMore" title="Load more..." />
  </v-list>
</template>
```

### Navigation Divider

```vue
<template>
  <v-list>
    <v-list-item v-for="item in primaryNav" :key="item.to" :to="item.to" :title="item.title" />
    <v-divider />
    <v-list-item v-for="item in secondaryNav" :key="item.to" :to="item.to" :title="item.title" />
  </v-list>
</template>
```

### Section Separator with Subheader

```vue
<template>
  <v-list>
    <v-subheader>Section A</v-subheader>
    <v-list-item v-for="item in sectionA" :key="item.id" :title="item.title" />
    <v-divider inset></v-divider>
    <v-subheader>Section B</v-subheader>
    <v-list-item v-for="item in sectionB" :key="item.id" :title="item.title" />
  </v-list>
</template>
```

## Implementation Notes

- Use `v-divider` to separate content sections, not as decorative elements.
- For decorative purposes, add `role="presentation"` to override the default `separator` ARIA role.
- Inset dividers (`inset` prop) align with list items at 72px offset.
- Vertical dividers work well in flex layouts with `align-center` for proper alignment.
- The `content-offset` prop accepts a single value or an array `[start, end]` for precise positioning.
- Combine `gradient` with `opacity` for subtle fading effects.
- Default ARIA role is `separator` with `aria-orientation="horizontal"` (or `vertical` when `vertical` prop is set).
