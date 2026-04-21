# v-form

## Overview

Use `v-form` to add validation to form inputs. All input components have a `rules` prop that specifies conditions in which the input is either valid or invalid. Whenever the value of an input is changed, each rule receives a new value and is re-evaluated. If a rule returns `false` or a string, validation has failed and the string is presented as an error message.

## Key Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `v-model` | `boolean \| null` | `-` | Form validation state: `true` (valid), `false` (invalid with interaction), `null` (invalid without interaction or lazy) |
| `validate-on` | `string` | `'input lazy'` | When validation runs: `input`, `blur`, `submit`, `invalid-input`, `eager`, `lazy` |
| `disabled` | `boolean` | `false` | Disables all form inputs |
| `readonly` | `boolean` | `false` | Makes all form inputs readonly |
| `fast-fail` | `boolean` | `false` | Stops validation on first error |

## Validation States

| State | Meaning |
| --- | --- |
| `true` | All inputs with validation rules have been successfully validated |
| `false` | At least one input has failed validation by interaction or manual validation |
| `null` | At least one input has failed validation without interaction or not yet validated due to lazy validation |

## Validate-On Behavior

| Value | On Mount | On Input | On Blur | On Submit |
| --- | --- | --- | --- | --- |
| `input` (default) | Runs, no error display | Runs | Runs | Runs |
| `blur` | Runs, no error display | No | Runs | Runs |
| `submit` | Runs, no error display | No | No | Runs |
| `eager` | Runs, shows error immediately | Runs | Runs | Runs |
| `lazy` | No validation | Runs | Runs | Runs |
| `invalid-input` | Runs, no error display | Runs only if previously invalid | Runs | Runs |

- `eager` and `lazy` can be combined with other options but not each other. Both imply `input` on their own.
- Use `validate-on="submit lazy"` to only validate when the form is submitted (useful for async rules).

## Basic Usage with Validation

```vue
<template>
  <v-form v-model="valid">
    <v-container>
      <v-row>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="firstname"
            :counter="10"
            :rules="nameRules"
            label="First name"
            required
          ></v-text-field>
        </v-col>

        <v-col cols="12" md="4">
          <v-text-field
            v-model="lastname"
            :counter="10"
            :rules="nameRules"
            label="Last name"
            required
          ></v-text-field>
        </v-col>

        <v-col cols="12" md="4">
          <v-text-field
            v-model="email"
            :rules="emailRules"
            label="E-mail"
            required
          ></v-text-field>
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const valid = ref(false)
const firstname = ref('')
const lastname = ref('')
const email = ref('')

const nameRules = [
  (value: string) => {
    if (value) return true
    return 'Name is required.'
  },
  (value: string) => {
    if (value?.length <= 10) return true
    return 'Name must be less than 10 characters.'
  },
]

const emailRules = [
  (value: string) => {
    if (value) return true
    return 'E-mail is required.'
  },
  (value: string) => {
    if (/.+@.+\..+/.test(value)) return true
    return 'E-mail must be valid.'
  },
]
</script>
```

## Required Field Rule

```vue
<template>
  <v-text-field
    v-model="firstName"
    :rules="rules"
    label="First name"
  ></v-text-field>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const firstName = ref('')

const rules = [
  (value: string) => {
    if (value) return true
    return 'You must enter a first name.'
  },
]
</script>
```

## Async Validation on Submit

Use `validate-on="submit lazy"` to only call validation when the form is submitted.

```vue
<template>
  <v-sheet class="mx-auto" max-width="300">
    <v-form validate-on="submit lazy" @submit.prevent="submit">
      <v-text-field
        v-model="userName"
        :rules="rules"
        label="User name"
      ></v-text-field>

      <v-btn
        :loading="loading"
        class="mt-2"
        text="Submit"
        type="submit"
        block
      ></v-btn>
    </v-form>
  </v-sheet>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const rules = [(value: string) => checkApi(value)]

const loading = ref(false)
const userName = ref('')

async function submit(event: Promise<any>) {
  loading.value = true
  const results = await event
  loading.value = false
  alert(JSON.stringify(results, null, 2))
}

let timeout: number = -1
async function checkApi(userName: string): Promise<boolean | string> {
  return new Promise(resolve => {
    clearTimeout(timeout)

    timeout = setTimeout(() => {
      if (!userName) return resolve('Please enter a user name.')
      if (userName === 'johnleider') return resolve('User name already taken. Please try another one.')
      return resolve(true)
    }, 1000)
  })
}
</script>
```

The `submit` event is a combination of a native `SubmitEvent` with a promise, so it can be awaited or used with `.then()` to get the result of the validation.

## Implementation Notes

- Rules are validated sequentially and display a maximum of 1 error at a time. Order rules accordingly.
- A rule should return `true` for valid, or a `string` for the error message.
- Use `v-model` on `v-form` to track the overall validation state.
- Use `validate-on="submit"` to defer validation until form submission.
- Use `validate-on="submit lazy"` to skip validation on mount entirely (useful for async rules).
- Use `fast-fail` prop to stop validation on the first error instead of running all rules.
- Combine `type="submit"` on buttons with `@submit.prevent` on the form for proper form submission handling.
- The validation state `null` means validation has not been triggered yet (lazy) or there are hidden errors. Use `!valid` to check for any error, or `valid === false` to check only for displayed errors.
