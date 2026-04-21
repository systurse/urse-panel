# v-text-field

## Overview

Use `v-text-field` for collecting user-provided text input. It is a versatile `<input type="text">` field that combines both `v-input` and `v-field` components into a single offering. It provides the baseline for other form inputs such as `v-select`, `v-autocomplete`, and `v-combobox`.

## Anatomy

| Element | Description |
| --- | --- |
| Container | Contains the `v-input` and `v-field` components |
| Prepend icon | Custom icon located before `v-field` |
| Prepend-inner icon | Custom icon located at the start of `v-field` |
| Label | Text area for identifying the input's purpose |
| Append-inner icon | Custom icon located at the end of `v-field` |
| Append icon | Custom icon located after `v-field` |

## Key Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model` | `any` | `-` | Input value |
| `label` | `string` | `-` | Text label for the input |
| `placeholder` | `string` | `-` | Placeholder text shown when input is empty |
| `variant` | `string` | `'filled'` | Visual style: `filled`, `outlined`, `plain`, `solo`, `underlined` |
| `type` | `string` | `'text'` | HTML input type: `text`, `email`, `password`, `number`, etc. |
| `rules` | `array` | `-` | Array of validation functions |
| `hint` | `string` | `-` | Helper text displayed below the input |
| `persistent-hint` | `boolean` | `false` | Always show hint regardless of focus state |
| `hide-details` | `boolean \| string \| array` | `-` | Hides hint, error, and counter. Use `'auto'` to only hide when no messages exist |
| `clearable` | `boolean` | `false` | Adds a clear icon to reset the input value |
| `persistent-clear` | `boolean` | `false` | Always show the clear icon when a value is present |
| `counter` | `boolean \| string \| number` | `false` | Displays character count. Set to `true` or a max length number |
| `persistent-counter` | `boolean` | `false` | Always show the counter element |
| `persistent-placeholder` | `boolean` | `false` | Always show placeholder, causes label to automatically elevate |
| `disabled` | `boolean` | `false` | Disables the input |
| `readonly` | `boolean` | `false` | Makes the input read-only |
| `color` | `string` | `primary` | Input color (affects label, icon, underline on focus) |
| `prepend-icon` | `string` | `-` | Icon displayed before the input |
| `append-icon` | `string` | `-` | Icon displayed after the input |
| `prepend-inner-icon` | `string` | `-` | Icon displayed inside the field at the start |
| `append-inner-icon` | `string` | `-` | Icon displayed inside the field at the end |
| `required` | `boolean` | `false` | Adds an asterisk to the label indicating the field is required |

## Basic Usage

### Label and Placeholder

```vue
<template>
  <v-text-field label="Label"></v-text-field>
</template>
```

### Variant

```vue
<template>
  <v-text-field
    label="Label"
    variant="underlined"
  ></v-text-field>
</template>
```

### Placeholder with Label

```vue
<template>
  <v-text-field
    label="Email address"
    placeholder="johndoe@gmail.com"
    type="email"
  ></v-text-field>
</template>
```

## Hints and Messages

### Basic Hint

```vue
<template>
  <v-responsive class="mx-auto" max-width="344">
    <v-text-field
      hint="Enter your password to access this website"
      label="Password"
      type="input"
    ></v-text-field>
  </v-responsive>
</template>
```

### Persistent Hint

```vue
<template>
  <v-text-field
    hint="Enter your password to access this website"
    label="Password"
    persistent-hint
    type="input"
  ></v-text-field>
</template>
```

## Clearable Input

### Basic Clearable

```vue
<template>
  <v-responsive class="mx-auto" max-width="344">
    <v-text-field
      v-model="model"
      hide-details="auto"
      label="Last name"
      clearable
    ></v-text-field>
  </v-responsive>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const model = ref('')
</script>
```

### Clear with Event Handler

```vue
<template>
  <v-text-field
    clearable
    label="Last name"
    placeholder="Doe"
    persistent-clear
    @click:clear="onClear"
  ></v-text-field>
</template>

<script setup lang="ts">
function onClear() {
  alert('User cleared the input')
}
</script>
```

Note that `readonly` will not remove the clear icon. To prevent readonly inputs from being cleared, also disable `clearable`.

## Validation and Rules

```vue
<template>
  <v-responsive class="mx-auto" max-width="344">
    <v-text-field
      :rules="[rules.required]"
      label="Last name"
      clearable
    ></v-text-field>
  </v-responsive>
</template>

<script setup lang="ts">
const rules = {
  required: (value: string) => {
    if (value) return true
    return 'This field is required.'
  },
}
</script>
```

## Custom Colors

The `color` prop changes the color of textual content (label, prefix, suffix, etc.) when the input is focused.

```vue
<template>
  <v-card class="mx-auto" max-width="344" title="User Registration">
    <v-container>
      <v-text-field
        v-model="first"
        color="primary"
        label="First name"
        variant="underlined"
      ></v-text-field>

      <v-text-field
        v-model="last"
        color="primary"
        label="Last name"
        variant="underlined"
      ></v-text-field>

      <v-text-field
        v-model="email"
        color="primary"
        label="Email"
        variant="underlined"
      ></v-text-field>

      <v-text-field
        v-model="password"
        color="primary"
        label="Password"
        placeholder="Enter your password"
        variant="underlined"
      ></v-text-field>
    </v-container>

    <v-divider></v-divider>

    <v-card-actions>
      <v-spacer></v-spacer>

      <v-btn color="success">
        Complete Registration
        <v-icon icon="mdi-chevron-right" end></v-icon>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const first = ref('')
const last = ref('')
const email = ref('')
const password = ref('')
</script>
```

## Implementation Notes

- Use `variant` prop to change the visual style of the input. Available variants: `filled`, `outlined`, `plain`, `solo`, `underlined`.
- Use `hide-details="auto"` to only hide the details section when no messages (errors, hints, counter) are present.
- Combine `clearable` with `@click:clear` event to perform custom actions when the input is cleared.
- Use `persistent-hint`, `persistent-clear`, `persistent-counter`, and `persistent-placeholder` to force those elements to always be visible.
- The `counter` prop can be set to `true` to show character count, or a number to set a maximum length.
- Rules accept an array of functions that return either `true` (valid) or a `string` (error message).
- Use `color` to customize the focus color of the input to match your design or theme.
- For icons, prefer using Material Design Icons (MDI) or the icon set configured in your Vuetify theme.
- The `type` prop controls the HTML input type. Use `email`, `password`, `number`, `tel`, `url`, etc. for appropriate keyboard and validation behavior.
