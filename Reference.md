The v-divider component is used to separate sections of lists or layouts.
Usage

Dividers in their simplest form display a horizontal line.
Examples
Props
Inset

Inset dividers are moved 72px to the right. This will cause them to line up with list items.

Gradient

Easily enable fading effect with gradient prop for a modern look.

<v-divider color="red" opacity=".7" thickness="3" gradient></v-divider>
      <v-divider opacity=".7" thickness="3" gradient>OR</v-divider>

Vertical

Vertical dividers give you more tools for unique layouts.
<v-divider vertical></v-divider>
Slots
Default

When you pass any content to be placed in between dividers simply by utilizing the default slot.
<template>
  <v-container class="d-flex flex-column gr-4">
    <v-divider content-offset="2rem" opacity=".7" thickness="5" variant="dotted" gradient>CHAPTER 1.4</v-divider>
    <v-divider :content-offset="[40, -1.5]" opacity=".7" thickness="2" variant="dashed">∞</v-divider>
    <v-divider :content-offset="[12, 2.5]" opacity=".7">* * *</v-divider>
    <v-divider color="primary" content-offset="-16" opacity="1" style="color: inherit" thickness="1">
      <v-avatar class="border border-primary border-opacity-100" icon="mdi-chevron-down" size="36"></v-avatar>
    </v-divider>
  </v-container>
</template>
Misc
Portrait View

Create custom cards to fit any use-case.
Subheaders

Dividers and subheaders can help break up content and can optionally line up with one another by using the same inset prop.
<v-divider
          v-else-if="item.divider"
          :key="index"
          inset
        ></v-divider>

Accessibility

By default, v-divider components are assigned the WAI-ARIA role of
separator
which denotes that the divider “separates and distinguishes sections of content or groups of menu items.” However, sometimes a divider is just a way to make an interface look nice. In those cases, the role of
presentation
should be used which denotes “an element whose implicit native role semantics will not be mapped to the accessibility API.” To override the default separator role in a v-divider, simply add a role="presentation" prop to your component. In addition, v-divider components have an aria-orientation="horizontal". If vertical="true", then aria-orientation="vertical" will be set automatically as well. If role="presentation", aria-orientation="undefined", its default value.