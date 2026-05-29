/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
    },
    keyframes: {
      messagePop: {
        '0%': { opacity: '0', transform: 'translateY(20px) scale(0.95)' },
        '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
      },
      fadeUp: {
        '0%': {opacity: '0', transform: 'translateY(20px)'},
        '100%': {opacity: '1', transform: 'translateY(0)'},
      },
      fadeDown: {
        '0%': { opacity: '0', transform: 'translateY(-20px)' },
        '100%': { opacity: '1', transform: 'translateY(0)' },
      },
      fadeOut: {
        '0%': { opacity: '1', transform: 'translateY(0)' },
        '100%': { opacity: '0', transform: 'translateY(-20px)' },
      },
      typingDot: {
        '0%, 100%': { transform: 'translateY(0)' },
        '50%': { transform: 'translateY(-4px)' },
      },
      shimmer: {
        '100%': { transform: 'translateX(100%)' }
      }
    },
    animation: {
      'fade-up': 'fadeUp 0.5s ease-out forwards',
      'fade-down': 'fadeDown 0.5s ease-out forwards',
      'fade-out': 'fadeOut 0.5s ease-in forwards',
      'message-pop': 'messagePop 0.25s ease-out forwards',
      'typing-dot': 'typingDot 1.4s ease-in-out infinite',
      'shimmer': 'shimmer 1.5s infinite',
    }
  },
  plugins: [require("tailwindcss-animate")],
}