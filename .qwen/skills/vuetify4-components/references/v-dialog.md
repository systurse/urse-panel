# v-dialog

## Overview

Use `v-dialog` to inform users about a specific task, present critical information, require decisions, or involve multiple tasks. It extends `v-overlay` and is controlled by a `v-model` and/or an activator slot.

## Key Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model` | `boolean` | `false` | Controls dialog visibility |
| `max-width` | `string \| number` | `-` | Maximum width of the dialog |
| `width` | `string \| number` | `auto` | Width of the dialog |
| `persistent` | `boolean` | `false` | Prevents dismissal when clicking outside or pressing esc |
| `scrollable` | `boolean` | `false` | Makes the dialog scrollable |
| `transition` | `string \| object` | `dialog-transition` | Transition animation |
| `origin` | `string` | `center center` | CSS transform-origin |

## Slots

| Slot | Description |
| --- | --- |
| `activator` | Provides `props` to bind to the triggering element. Receives `{ props, isActive }` |
| `default` | Dialog content. Receives `{ isActive }` for controlling visibility |

## Basic Usage with Activator

```vue
<template>
  <v-dialog max-width="500">
    <template v-slot:activator="{ props: activatorProps }">
      <v-btn
        v-bind="activatorProps"
        color="surface-variant"
        text="Open Dialog"
        variant="flat"
      ></v-btn>
    </template>

    <template v-slot:default="{ isActive }">
      <v-card title="Dialog">
        <v-card-text>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn
            text="Close Dialog"
            @click="isActive.value = false"
          ></v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>
```

## v-model Control

Trigger a dialog by updating `v-model` directly without using an activator slot.

```vue
<template>
  <div class="text-center pa-4">
    <v-btn @click="dialog = true">
      Open Dialog
    </v-btn>

    <v-dialog
      v-model="dialog"
      width="auto"
    >
      <v-card
        max-width="400"
        prepend-icon="mdi-update"
        text="Your application will relaunch automatically after the update is complete."
        title="Update in progress"
      >
        <template v-slot:actions>
          <v-btn
            class="ms-auto"
            text="Ok"
            @click="dialog = false"
          ></v-btn>
        </template>
      </v-card>
    </v-dialog>
  </div>
</template>
```

## Persistent Dialog

Persistent dialogs are not dismissed when touching outside or pressing the esc key.

```vue
<template>
  <v-dialog
    v-model="dialog"
    max-width="400"
    persistent
  >
    <v-card title="Persistent Dialog">
      <v-card-text>
        This dialog cannot be dismissed by clicking outside.
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text="Close" @click="dialog = false"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
```

## Nested Dialogs

Dialogs can be nested within each other.

```vue
<template>
  <div class="pa-4 text-center">
    <v-btn text="Open Dialog 1" @click="dialog = true"></v-btn>

    <v-dialog v-model="dialog" max-width="480">
      <v-card title="Dialog 1">
        <template v-slot:text>
          <v-btn
            class="my-2"
            text="Open Dialog 2"
            @click="dialog2 = true"
          ></v-btn>
        </template>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text="Close" variant="text" @click="dialog = false"></v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialog2" max-width="240">
      <v-card title="Dialog 2">
        <template v-slot:text>
          <v-btn
            class="my-2"
            text="Open Dialog 3"
            @click="dialog3 = !dialog3"
          ></v-btn>
        </template>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text="Close" variant="text" @click="dialog2 = false"></v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialog3" width="auto">
      <v-card title="Dialog 3">
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text="Close" variant="text" @click="dialog3 = false"></v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
```

## Overflowed Dialog

Dialogs that do not fit within the available window space will scroll the container.

```vue
<template>
  <div class="pa-4 text-center">
    <v-dialog max-width="800">
      <template v-slot:activator="{ props: activatorProps }">
        <v-btn
          v-bind="activatorProps"
          text="Open Dialog"
        ></v-btn>
      </template>

      <template v-slot:default="{ isActive }">
        <v-card title="Use Google's location service?">
          <template v-slot:text>
            <p v-for="i in 20" :key="i">
              Paragraph {{ i }}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </p>
          </template>

          <v-card-actions>
            <v-spacer></v-spacer>

            <v-btn
              text="Disagree"
              variant="text"
              @click="isActive.value = false"
            ></v-btn>

            <v-btn
              color="surface-variant"
              text="Agree"
              variant="flat"
              @click="isActive.value = false"
            ></v-btn>
          </v-card-actions>
        </v-card>
      </template>
    </v-dialog>
  </div>
</template>
```

## Implementation Notes

- Use `v-model` for direct control or `activator` slot for automatic trigger binding.
- Use `persistent` when the user must make a decision before continuing.
- Nesting dialogs is supported but use sparingly to avoid confusing the user.
- Long content automatically scrolls; use `scrollable` prop for alternative scrolling behavior.
- Combine with `v-card` for consistent dialog structure (title, text, actions).
- Use `v-spacer` in `v-card-actions` to align buttons to the right.
- Close dialogs by setting `v-model = false` or `isActive.value = false` when using the activator slot.
