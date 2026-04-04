import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        skin: {
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
          tertiary: "var(--bg-tertiary)",
          elevated: "var(--bg-elevated)",
          input: "var(--bg-input)",
          deep: "var(--bg-deep)",
          card: "var(--card-bg)",
          overlay: "var(--overlay-bg)",
          border: "var(--border)",
          "border-focus": "var(--border-focus)",
          "border-subtle": "var(--border-subtle)",
          "border-ui": "var(--border-ui-color)",
          "text-primary": "var(--text-primary)",
          "text-secondary": "var(--text-secondary)",
          "text-muted": "var(--text-muted)",
          accent: "var(--accent)",
          "accent-hover": "var(--accent-hover)",
          "accent-subtle": "var(--accent-subtle)",
          "accent-bg": "var(--accent-bg)",
          "accent-bg-light": "var(--accent-bg-light)",
          "accent-border": "var(--accent-border)",
          success: "var(--success)",
          "success-bg": "var(--success-bg)",
          "success-border": "var(--success-border)",
          warning: "var(--warning)",
          "warning-bg": "var(--warning-bg)",
          "warning-border": "var(--warning-border)",
          danger: "var(--danger)",
          "danger-hover": "var(--danger-hover)",
          "danger-bg": "var(--danger-bg)",
          "danger-border": "var(--danger-border)",
          orange: "var(--orange)",
          "orange-bg": "var(--orange-bg)",
        },
      },
      boxShadow: {
        skin: "var(--shadow-sm)",
        "skin-hover": "var(--shadow-hover)",
        "skin-md": "var(--shadow-md)",
        "skin-lg": "var(--shadow-lg)",
        "skin-card": "var(--shadow-card)",
        "skin-elevated": "var(--shadow-elevated)",
      },
      borderWidth: {
        ui: "var(--border-ui-width)",
      },
    },
  },
  plugins: [],
};
export default config;
