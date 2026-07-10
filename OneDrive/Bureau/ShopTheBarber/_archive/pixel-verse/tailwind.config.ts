import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Playfair Display", "serif"],
        heading: ["Playfair Display", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        montserrat: ["Montserrat", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "hsl(var(--primary-50))",
          100: "hsl(var(--primary-100))",
          200: "hsl(var(--primary-200))",
          300: "hsl(var(--primary-300))",
          400: "hsl(var(--primary-400))",
          500: "hsl(var(--primary-500))",
          600: "hsl(var(--primary-600))",
          700: "hsl(var(--primary-700))",
          800: "hsl(var(--primary-800))",
          900: "hsl(var(--primary-900))",
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
        // 🎨 Enhanced Moroccan Premium Brand Colors
        moroccan: {
          green: "hsl(var(--moroccan-green))",
          gold: "hsl(var(--moroccan-gold))",
          sand: "hsl(var(--moroccan-sand))",
          charcoal: "hsl(var(--moroccan-charcoal))",
          offwhite: "hsl(var(--moroccan-offwhite))",
          darkgrey: "hsl(var(--moroccan-darkgrey))",
          terracotta: "hsl(var(--moroccan-terracotta))",
          "royal-blue": "hsl(var(--moroccan-royal-blue))",
          cream: "hsl(var(--moroccan-cream))",
          copper: "hsl(var(--moroccan-copper))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        // 🎨 Enhanced Moroccan Premium Animations
        "fade-in": {
          "0%": { 
            opacity: "0",
            transform: "translateY(10px)"
          },
          "100%": { 
            opacity: "1",
            transform: "translateY(0)"
          },
        },
        "slide-up": {
          "0%": { 
            opacity: "0",
            transform: "translateY(30px)"
          },
          "100%": { 
            opacity: "1",
            transform: "translateY(0)"
          },
        },
        "scale-in": {
          "0%": { 
            opacity: "0",
            transform: "scale(0.9)"
          },
          "100%": { 
            opacity: "1",
            transform: "scale(1)"
          },
        },
        "gold-glow": {
          "0%, 100%": { 
            boxShadow: "0 0 20px rgba(199, 162, 83, 0.3)"
          },
          "50%": { 
            boxShadow: "0 0 30px rgba(199, 162, 83, 0.6)"
          },
        },
        "moroccan-pulse": {
          "0%, 100%": { 
            transform: "scale(1)",
            opacity: "1"
          },
          "50%": { 
            transform: "scale(1.05)",
            opacity: "0.8"
          },
        },
        // New animation for focus states
        "focus-pulse": {
          "0%, 100%": { 
            opacity: "0.3",
            transform: "scale(1)"
          },
          "50%": { 
            opacity: "0.6",
            transform: "scale(1.02)"
          },
        },
        // New animation for pattern movement
        "pattern-slide": {
          "0%": { 
            left: "-100%"
          },
          "100%": { 
            left: "100%"
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s ease-out",
        "slide-up": "slide-up 0.8s ease-out",
        "scale-in": "scale-in 0.5s ease-out",
        "gold-glow": "gold-glow 2s ease-in-out infinite",
        "moroccan-pulse": "moroccan-pulse 3s ease-in-out infinite",
        "focus-pulse": "focus-pulse 2s ease-in-out infinite",
        "pattern-slide": "pattern-slide 0.6s ease-out",
      },
      // 🧱 Enhanced Layout & Spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },
      // 📱 Enhanced Responsive Breakpoints
      screens: {
        'xs': '475px',
        '3xl': '1600px',
        '4xl': '1920px',
      },
      // 🎨 Enhanced Box Shadows
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(199, 162, 83, 0.1)',
        'glass-hover': '0 8px 32px 0 rgba(0,0,0,0.12), 0 3px 8px 0 rgba(0,0,0,0.06), 0 0 0 1px var(--moroccan-gold)',
        'moroccan': '0 10px 25px -3px rgba(199, 162, 83, 0.1), 0 4px 6px -2px rgba(199, 162, 83, 0.05)',
        'moroccan-lg': '0 20px 25px -5px rgba(199, 162, 83, 0.1), 0 10px 10px -5px rgba(199, 162, 83, 0.04)',
        'moroccan-xl': '0 25px 50px -12px rgba(199, 162, 83, 0.25)',
        'button': '0 4px 14px rgba(199, 162, 83, 0.25)',
        'button-hover': '0 8px 18px rgba(199, 162, 83, 0.4)',
      },
      // 🎨 Enhanced Gradients
      backgroundImage: {
        'radial-gentle': 'radial-gradient(circle at 10% 20%, rgba(26, 26, 26, 0.9) 0%, rgba(10, 10, 10, 0.95) 90%)',
        'moroccan-gradient': 'linear-gradient(135deg, hsl(var(--moroccan-green)) 0%, hsl(var(--moroccan-gold)) 100%)',
        'moroccan-radial': 'radial-gradient(circle, hsl(var(--moroccan-gold)) 0%, hsl(var(--moroccan-green)) 100%)',
        'gold-gradient': 'linear-gradient(135deg, hsl(var(--moroccan-gold)) 0%, hsl(var(--moroccan-copper)) 100%)',
        'glass-overlay': 'linear-gradient(135deg, rgba(26, 26, 26, 0.4) 0%, rgba(10, 10, 10, 0.4) 100%)',
      },
      // 🎨 New backdrop blur utilities
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '20px',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // New plugin for enhanced pattern utilities
    function ({ addUtilities }: any) {
      const newUtilities = {
        '.glass-card': {
          '@apply backdrop-blur-xl bg-opacity-20 bg-gray-800 border border-gray-700 rounded-xl': {},
          background: 'rgba(26, 26, 26, 0.4)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(199, 162, 83, 0.1)',
          backdropFilter: 'blur(12px)',
          transition: 'all 0.3s ease-out',
        },
        '.moroccan-button-hover': {
          '@apply hover:shadow-lg hover:shadow-moroccan-gold/40 hover:scale-[1.03]': {},
          transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        },
        '.moroccan-input': {
          '@apply bg-moroccan-charcoal border border-moroccan-darkgrey rounded-lg px-4 py-3 text-white transition-all': {},
          '&:focus': {
            '@apply border-moroccan-gold ring-2 ring-moroccan-gold/30': {},
          },
        },
      };
      addUtilities(newUtilities);
    },
  ],
} satisfies Config;