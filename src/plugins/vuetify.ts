/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

import { createVuetify } from 'vuetify'
// MUST import styles first - order is critical for CSS layers
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import '../styles/layers.css'

// URSE brand colors
const urseColors = {
  light: {
    'primary': '#FAB21A',
    'on-primary': '#000000',
    'secondary': '#000000',
    'on-secondary': '#FAB21A',
    'accent': '#FAB21A',
    'on-accent': '#000000',
    'background': '#f7f7f7',
    'on-background': '#1a1a1a',
    'surface': '#ffffff',
    'on-surface': '#1a1a1a',
    'error': '#b00020',
    'on-error': '#ffffff',
    'info': '#2196f3',
    'on-info': '#ffffff',
    'success': '#4caf50',
    'on-success': '#ffffff',
    'warning': '#fb8c00',
    'on-warning': '#000000',
  },
  dark: {
    'primary': '#FAB21A',
    'on-primary': '#000000',
    'secondary': '#ffffff',
    'on-secondary': '#000000',
    'accent': '#FAB21A',
    'on-accent': '#000000',
    'background': '#0a0a0a',
    'on-background': '#ffffff',
    'surface': '#161616',
    'on-surface': '#ffffff',
    'error': '#cf6679',
    'on-error': '#ffffff',
    'info': '#2196f3',
    'on-info': '#ffffff',
    'success': '#4caf50',
    'on-success': '#ffffff',
    'warning': '#fb8c00',
    'on-warning': '#000000',
  },
}

export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: urseColors.light,
      },
      dark: {
        dark: true,
        colors: urseColors.dark,
      },
    },
  },
  display: {
    mobileBreakpoint: 'md',
    thresholds: {
      xs: 0,
      sm: 600,
      md: 840,
      lg: 1145,
      xl: 1545,
      xxl: 2138,
    },
  },
})
