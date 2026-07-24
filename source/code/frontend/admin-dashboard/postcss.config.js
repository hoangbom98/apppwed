// postcss.config.js — admin-dashboard
// Tailwind removed; antd uses CSS-in-JS (no PostCSS processing needed).
// Keep autoprefixer for any remaining custom CSS.
export default {
  plugins: {
    autoprefixer: {},
  },
};
