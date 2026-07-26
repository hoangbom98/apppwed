# LKVIP Visual Asset Standards

To ensure a consistent UI across all LKVIP sub-projects (Hub, Game, Trade, etc.), all visual assets must adhere to the following standards.

## 1. File Formats
- **Logos / Icons:** Must be in **SVG** format for scalability, except when raster formats (WebP) are strictly required for artistic effects.
- **Banners / Photos:** Must be in **WebP** format. Do not use PNG/JPG for production assets.

## 2. Standardization Table

| Asset Type | Primary Use Case | Aspect Ratio | Max/Std Size (Approx) | Container Style |
| :--- | :--- | :--- | :--- | :--- |
| **Main Logo** | Header / Navbar | Variable (Free) | H: 56px, W: Max 360px | `object-contain` |
| **Partner Logo** | Footer / About | 1:1 or 4:3 | 180x156px (max) | `object-contain` |
| **Banner (Main)** | Hero Section | 16:9 | Responsive (Full Width) | `object-cover` |
| **Banner (Card)** | Listing / Grid | 3:2 | Responsive | `object-cover`, `rounded-lg` |
| **Flag / Icon** | Locale / Status | 1:1 | 28x28px - 36x36px | `object-contain` |

## 3. Implementation
Use the `@lkvip/constants` package for standardized sizes and the `@lkvip/ui` component library wrappers (e.g., `<Logo />`, `<Banner />`) to enforce these styles automatically. Never hardcode classes in the apps.
