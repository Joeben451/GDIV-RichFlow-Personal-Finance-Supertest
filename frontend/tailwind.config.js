/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    screens: {
      'xs': '320px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Base colors
        dark: '#1E1E1E',
        gold: '#EDCA69',
        purple: '#7345AF',
        
        // RichFlow brand colors
        'richflow': {
          'purple': '#7345AF',
          'purple-light': '#9d6dd4',
          'purple-lighter': '#b794e0',
          'purple-dark': '#5c3a8f',
          'gold': '#EDCA69',
          'gold-light': '#f5dfa0',
          'dark': '#1a1a1a',
          'darker': '#0f0f0f',
          'darkest': '#0e0e10',
          'border': '#2a2a2a',
          'text': '#e8e8f0',
          'text-muted': '#888888',
        },
        
        // Semantic colors
        'positive': '#2ecc71',
        'positive-light': '#7be5c9',
        'negative': '#ff6b6b',
        'negative-light': '#ff9a9a',
        'expense': '#e0626f',
        'expense-light': '#f3a6b0',
        'asset': '#5aa8ff',
        'liability': '#ff7b7b',
      },
      
      // Custom gradients via backgroundImage
      backgroundImage: {
        // Primary gradient for headers and buttons
        'richflow-gradient': 'linear-gradient(135deg, #7345AF 0%, #9d6dd4 100%)',
        'richflow-gradient-hover': 'linear-gradient(135deg, #5c3a8f 0%, #7345AF 100%)',
        
        // Card header gradients (lighter variant)
        'richflow-card-header': 'linear-gradient(135deg, #9d6dd4 0%, #b794e0 100%)',
        
        // Progress bar gradients
        'progress-positive': 'linear-gradient(90deg, #2ecc71 0%, #7be5c9 100%)',
        'progress-negative': 'linear-gradient(90deg, #ff6b6b 0%, #ff9a9a 100%)',
        
        // Bar chart gradients
        'bar-income': 'linear-gradient(90deg, #7345AF 0%, #c69df7 100%)',
        'bar-expenses': 'linear-gradient(90deg, #e0626f 0%, #f3a6b0 100%)',
        'bar-cashflow': 'linear-gradient(90deg, #2ecc71 0%, #7be5c9 100%)',
        'bar-assets': 'linear-gradient(90deg, #EDCA69 0%, #f5dfa0 100%)',
        'bar-liabilities': 'linear-gradient(90deg, #ff7b7b 0%, #ffb0b0 100%)',
        
        // Scrollbar gradient
        'scrollbar': 'linear-gradient(135deg, #7345AF 0%, #EDCA69 100%)',
      },
      
      fontSize: {
        'fluid-xs': 'clamp(0.75rem, 1vw + 0.5rem, 0.875rem)',
        'fluid-sm': 'clamp(0.875rem, 1.5vw + 0.5rem, 1rem)',
        'fluid-base': 'clamp(1rem, 2vw + 0.5rem, 1.125rem)',
        'fluid-lg': 'clamp(1.125rem, 2.5vw + 0.5rem, 1.25rem)',
        'fluid-xl': 'clamp(1.25rem, 3vw + 0.5rem, 1.5rem)',
        'fluid-2xl': 'clamp(1.5rem, 3.5vw + 0.5rem, 2rem)',
        'fluid-3xl': 'clamp(1.875rem, 4vw + 0.5rem, 2.5rem)',
      },
      
      spacing: {
        'mobile-xs': '0.5rem',
        'mobile-sm': '0.75rem',
        'mobile-md': '1rem',
        'mobile-lg': '1.5rem',
        'desktop-xs': '1rem',
        'desktop-sm': '1.5rem',
        'desktop-md': '2rem',
        'desktop-lg': '3rem',
      },
      
      borderRadius: {
        'card': '16px',
        'card-header': '12px',
        'button': '10px',
        'input': '8px',
        'pill': '999px',
      },
      
      boxShadow: {
        'card': '0 4px 15px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 6px 20px rgba(115, 69, 175, 0.2)',
        'header': '0 4px 12px rgba(115, 69, 175, 0.3)',
        'button': '0 4px 12px rgba(157, 109, 212, 0.4)',
        'button-hover': '0 4px 12px rgba(115, 69, 175, 0.3)',
        'input-focus': '0 0 0 2px rgba(157, 109, 212, 0.2)',
        'bar': '0 6px 18px rgba(0, 0, 0, 0.4)',
        'progress': '0 4px 10px rgba(121, 72, 204, 0.18)',
        'graph-card': '0 8px 24px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.02)',
      },
      
      animation: {
        'spin-slow': 'spin 1s linear infinite',
      },
      
      minHeight: {
        'touch': '44px', // Minimum touch target size
      },
    },
  },
  plugins: [],
}
