import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        "secondary-fixed-dim": "#cfcb59",
        "tertiary-container": "#9a6b26",
        "on-tertiary-fixed": "#2a1800",
        "error-pink-pattern": "#FFEBEE",
        "secondary": "#646100",
        "tertiary": "#7e530d",
        "on-primary-fixed": "#032109",
        "surface": "#FFFFFF",
        "background": "#E8EFE8",
        "secondary-container": "#e9e46f",
        "on-primary-container": "#f7fff2",
        "on-secondary-container": "#686500",
        "on-tertiary-fixed-variant": "#643f00",
        "on-secondary": "#ffffff",
        "on-secondary-fixed": "#1e1d00",
        "on-tertiary": "#ffffff",
        "on-surface-variant": "#424841",
        "tertiary-fixed": "#ffddb5",
        "on-error-container": "#93000a",
        "surface-dim": "#dadad6",
        "primary-container": "#5c7d5c",
        "surface-container": "#eeeee9",
        "primary-fixed-dim": "#acd0aa",
        "text-secondary": "#5C4F2D",
        "surface-variant": "#e3e3de",
        "outline": "#737970",
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "on-primary": "#ffffff",
        "on-surface": "#1a1c19",
        "secondary-fixed": "#ece772",
        "on-background": "#1a1c19",
        "on-tertiary-container": "#fffbff",
        "tertiary-fixed-dim": "#f6bc6f",
        "error-container": "#ffdad6",
        "surface-container-low": "#f4f4ef",
        "primary-fixed": "#c8ecc5",
        "surface-bright": "#fafaf5",
        "neutral-gray": "#767774",
        "surface-container-lowest": "#ffffff",
        "inverse-on-surface": "#f1f1ec",
        "on-secondary-fixed-variant": "#4b4900",
        "surface-container-high": "#e8e8e4",
        "border": "rgba(118, 119, 116, 0.2)",
        "primary": "#446345",
        "surface-tint": "#466647",
        "inverse-primary": "#acd0aa",
        "outline-variant": "#c2c8be",
        "text-primary": "#0C0D05",
        "on-primary-fixed-variant": "#2f4e31",
        "inverse-surface": "#2f312e",
        "surface-container-highest": "#e3e3de"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "lg": "24px",
        "base": "4px",
        "xl": "48px",
        "sm": "8px",
        "max-width": "1200px",
        "md": "16px"
      },
      maxWidth: {
        "max-width": "1200px",
      },
      fontFamily: {
        "body-md": ["Inter", "sans-serif"],
        "disclaimer": ["Inter", "sans-serif"],
        "label-sm": ["Geist", "sans-serif"],
        "headline-md": ["Inter", "sans-serif"],
        "headline-lg": ["Inter", "sans-serif"]
      },
      fontSize: {
        "body-md": ["1rem", {"lineHeight": "1.6", "fontWeight": "400"}],
        "h2": ["1.5rem", {"lineHeight": "1.3", "fontWeight": "600"}],
        "disclaimer": ["14px", {"lineHeight": "1.4", "fontWeight": "400"}],
        "label-sm": ["0.875rem", {"lineHeight": "1.2", "fontWeight": "500"}],
        "headline-md": ["1.5rem", {"lineHeight": "1.3", "fontWeight": "600"}],
        "headline-lg": ["2rem", {"lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "700"}],
        "h1": ["2rem", {"lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "700"}]
      }
    },
  },
  plugins: [],
};

export default config;
