/** @type {import('tailwindcss').Config} */
const tokens = {
    colors: {
        primary: {
            "50": "#eef2ff",
            "100": "#e0e7ff",
            "200": "#c7d2fe",
            "300": "#a5b4fc",
            "400": "#818cf8",
            "500": "#6366f1", // Indigo 500
            "600": "#4f46e5", // Indigo 600
            "700": "#4338ca",
            "800": "#3730a3",
            "900": "#312e81",
            "950": "#1e1b4b"
        },
        secondary: {
            "50": "#faf5ff",
            "100": "#f3e8ff",
            "500": "#a855f7",
            "600": "#9333ea",
            "900": "#581c87"
        },
        surface: {
            "light": "#ffffff",
            "dark": "#020617",
            "glass": "rgba(255, 255, 255, 0.8)"
        },
        semantic: {
            "success": "#10b981",
            "warning": "#f59e0b",
            "error": "#ef4444",
            "info": "#0ea5e9"
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
            "3xl": "2rem",
            "4xl": "2.5rem"
        },
        "borderRadius": {
            "sm": "0.25rem",
            "default": "0.5rem",
            "md": "0.75rem",
            "lg": "1rem",
            "xl": "1.25rem",
            "2xl": "1.5rem",
            "3xl": "2rem",
            "full": "9999px"
        },
        "shadows": {
            "sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
            "default": "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
            "md": "0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 6px -1px rgb(0 0 0 / 0.04)",
            "lg": "0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)",
            "xl": "0 25px 50px -12px rgb(0 0 0 / 0.12)"
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
