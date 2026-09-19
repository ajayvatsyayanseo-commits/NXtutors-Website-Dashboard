import type { Config } from 'tailwindcss';

/**
 * The design system from section 14 of the build brief, as tokens.
 *
 * The public site's dark navy is the brand anchor and the teal accent carries
 * every action and progress state, so the app reads as "calm, verified, in
 * control" rather than as a marketing page. Nothing here invents a colour: if a
 * value is not in this file it does not belong in a component.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#080E1B',      // app bar, primary buttons, headings
        ink: '#1E293B',       // body text
        slate: '#475569',     // secondary text, labels
        muted: '#94A3B8',     // placeholders, disabled
        accent: {
          DEFAULT: '#0D9488', // links, progress, active tab, success
          soft: '#CCFBF1',    // selected chips, highlights
        },
        canvas: '#F1F5F9',    // app background
        line: '#CBD5E1',      // borders, dividers
        warn: '#B45309',      // expiry
        danger: '#B91C1C',    // errors, disputes
        ok: '#15803D',        // confirmations
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        // 12/14/16/20/24/30 on a 1.5 line-height. Data never below 14px.
        xs: ['0.75rem', { lineHeight: '1.5' }],
        sm: ['0.875rem', { lineHeight: '1.5' }],
        base: ['1rem', { lineHeight: '1.5' }],
        xl: ['1.25rem', { lineHeight: '1.4' }],
        '2xl': ['1.5rem', { lineHeight: '1.35' }],
        '3xl': ['1.875rem', { lineHeight: '1.3' }],
      },
      borderRadius: {
        card: '8px',
        chip: '999px',
      },
      boxShadow: {
        // One elevation level only: flat and fast to render on mid-range Android.
        card: '0 1px 2px rgba(8, 14, 27, 0.06), 0 1px 3px rgba(8, 14, 27, 0.04)',
      },
      spacing: {
        tab: '56px',   // tab bar height
        touch: '44px', // minimum touch target
      },
      transitionDuration: {
        DEFAULT: '180ms',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'slide-up': {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.4s infinite',
        'slide-up': 'slide-up 180ms ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
