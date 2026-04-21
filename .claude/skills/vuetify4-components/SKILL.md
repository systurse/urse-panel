---
name: vuetify4-components
description: Reference skill for documenting and applying Vuetify 4 components in Vue applications. Use when the user asks about Vuetify components, needs UI implementations, or encounters component-specific issues. Covers component props, variants, patterns, and best practices for building interfaces with Vuetify 4.
---

# Vuetify 4 Components

This skill provides guidance for working with Vuetify 4 components in Vue 3 applications.

## Overview

Vuetify 4 is a Vue UI component library built on Material Design principles. It provides a comprehensive set of components for building modern web applications.

**Key Features:**
- **CSS Cascade Layers:** Vuetify 4 uses CSS layers for style organization (`vuetify-core`, `vuetify-components`, `vuetify-utilities`, etc.)
- **Composition API:** All components work with Vue 3's `<script setup>` syntax
- **TypeScript Support:** Full type definitions for all components
- **Theme System:** Built-in light/dark theme support with custom colors
- **Utility Classes:** Spacing, display, flex, and typography helpers

## Instructions

### 1. CSS Configuration
Vuetify 4 requires proper CSS layer ordering for styles to work correctly. See [css-configuration.md](references/css-configuration.md) for layer setup, import order, and spacing utilities.

### 2. Component References
For specific component documentation, see the reference files in [references/](references/):
- **v-btn:** Buttons, variants, sizes, and patterns
- **v-dialog:** Dialogs, activator slots, and validation
- **v-form:** Form validation and rules
- **v-text-field:** Text inputs and field patterns
- **v-divider:** Section separators and layout dividers

### 3. Project Conventions
- Use Composition API with `<script setup>` syntax
- Use TypeScript for all component props and state
- Prefer Vuetify props over custom CSS (`variant`, `color`, `size`, etc.)
- Preserve existing project patterns when editing code
- Use `yarn` for running project commands

### 4. Development Workflow
1. Identify the component needed
2. Check the reference file in `references/` for props and examples
3. Implement using existing project patterns
4. Verify with `yarn type-check` after making changes
