/** @type {import('tailwindcss').Config} */
const tokens = {
    colors: {
        primary: {
            "50": "#eff6ff",
            "100": "#dbeafe",
            "200": "#bfdbfe",
            "300": "#93c5fd",
            "400": "#60a5fa",
            "500": "#3b82f6",
            "600": "#2563eb",
            "700": "#1d4ed8",
            "800": "#1e40af",
            "900": "#1e3a8a",
            "950": "#172554"
        },
        secondary: {
            "50": "#f5f3ff",
            "100": "#ede9fe",
            "500": "#8b5cf6",
            "600": "#7c3aed",
            "900": "#4c1d95"
        },
        surface: {
            "light": "#ffffff",
            "dark": "#0f172a",
            "glass": "rgba(255, 255, 255, 0.7)"
        },
        semantic: {
            "success": "#10b981",
            "warning": "#f59e0b",
            "error": "#ef4444",
            "info": "#3b82f6"
        }
    },
    typography: {
        fontFamily: {
            "sans": "Inter, ui-sans-serif, system-ui",
            "mono": "JetBrains Mono, monospace"
        },
        "fontSize": {
            "xs": "0.75rem",
            "sm": "0.875rem",
            "base": "1rem",
            "lg": "1.125rem",
            "xl": "1.25rem",
            "2xl": "1.5rem",
            "3xl": "1.875rem"
        },
        "borderRadius": {
            "sm": "0.125rem",
            "default": "0.25rem",
            "md": "0.375rem",
            "lg": "0.5rem",
            "xl": "0.75rem",
            "2xl": "1rem",
            "full": "9999px"
        },
        "shadows": {
            "sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
            "default": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
            "md": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
            "lg": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)"
        }
    }
};

module.exports = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: tokens.colors.primary,
                secondary: tokens.colors.secondary,
                surface: tokens.colors.surface,
                ...tokens.colors.semantic,
            },
            fontFamily: tokens.typography.fontFamily,
            fontSize: tokens.typography.fontSize,
            borderRadius: tokens.typography.borderRadius,
            boxShadow: tokens.typography.shadows,
        },
    },
    plugins: [],
};
