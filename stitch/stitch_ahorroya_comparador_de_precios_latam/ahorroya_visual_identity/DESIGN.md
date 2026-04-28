---
name: AhorroYA Visual Identity
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daea'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eefe'
  surface-container-high: '#e2e8f8'
  surface-container-highest: '#dce2f3'
  on-surface: '#151c27'
  on-surface-variant: '#3c4a42'
  inverse-surface: '#2a313d'
  inverse-on-surface: '#ebf1ff'
  outline: '#6c7a71'
  outline-variant: '#bbcabf'
  surface-tint: '#006c49'
  primary: '#006c49'
  on-primary: '#ffffff'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#4edea3'
  secondary: '#3755c3'
  on-secondary: '#ffffff'
  secondary-container: '#708cfd'
  on-secondary-container: '#00217a'
  tertiary: '#855300'
  on-tertiary: '#ffffff'
  tertiary-container: '#e29100'
  on-tertiary-container: '#523200'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#dde1ff'
  secondary-fixed-dim: '#b8c4ff'
  on-secondary-fixed: '#001453'
  on-secondary-fixed-variant: '#173bab'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f9f9ff'
  on-background: '#151c27'
  surface-variant: '#dce2f3'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-bold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
  price-display:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  margin-page: 20px
  gutter-card: 16px
  padding-element: 12px
  stack-gap: 8px
---

## Brand & Style
The design system is built to evoke immediate confidence and utility for users navigating price fluctuations and savings opportunities. The brand personality is **Proactive, Realistic, and Accessible**. It moves away from abstract fintech minimalism toward a "utility-first" aesthetic inspired by high-traffic platforms like MercadoLibre and Google Maps.

The design style is **Corporate / Modern with Tactile influences**. It prioritizes high legibility and clear information density. By using realistic depth and familiar mobile patterns, the design system ensures users feel the app is a reliable tool rather than a complex financial instrument. The interface is optimized for speed, using heavy-weight interactive elements that feel responsive and "physical" under the thumb.

## Colors
This design system utilizes a high-contrast palette to drive action and highlight value. 

- **Ahorro Green (#10B981):** The primary driver. Used for "Buy" signals, savings amounts, and primary action buttons. It is vibrant and positive, signaling growth and opportunity.
- **Trust Blue (#1E40AF):** The secondary anchor. Used for data-heavy sections, price history charts, and official information. It provides a professional weight to balance the vibrant green.
- **Surface Strategy:** Backgrounds are kept as clean White (#FFFFFF) to maximize contrast. Secondary surfaces use a soft Grey (#F3F4F6) to define card boundaries and grouping without adding visual noise.
- **Data Visualization:** Use a strict semantic system for price trends—Green for "Good Price/Down," Red for "High Price/Up," and Blue for "Average/Stable."

## Typography
The typography strategy relies on the clarity of native-style sans-serifs. **Manrope** is used for headlines and price displays to provide a slightly more modern, geometric character that feels high-tech yet approachable. **Inter** is used for all body text and UI labels due to its exceptional legibility at small sizes on mobile displays.

Numerical data is the hero of this design system. Price points should always be rendered in bold Manrope with tight letter spacing to appear as a single, recognizable unit. Hierarchy is strictly enforced: large, bold headlines for navigation and clear, smaller Inter text for descriptions and metadata.

## Layout & Spacing
This design system follows a **fluid mobile grid** with a focus on "Safe Margins." The layout uses a 20px outer margin to provide breathing room on modern edge-to-edge smartphone displays.

The spacing rhythm is based on a 4px baseline grid. Components are typically separated by 16px (gutter-card) to maintain distinct visual groups. Within cards, a tighter 8px stack gap is used to associate related data (e.g., a product name and its current price). The layout philosophy prioritizes vertical scrolling and clear scanning, using full-width or inset-card patterns to guide the eye downward through price lists.

## Elevation & Depth
Depth is used functionally in the design system to indicate interactivity and hierarchy. 

1.  **Low-Elevation Surfaces:** Most cards sit on a "Level 1" elevation, using a very soft, diffused ambient shadow (10% opacity Trust Blue tint) to lift them slightly off the white background.
2.  **Interactive States:** Primary buttons and active cards use a slightly more pronounced shadow to appear "pressable." 
3.  **Sheet Layering:** Modals and bottom sheets use a 20% backdrop blur (Glassmorphism influence) combined with a high-elevation shadow to signify they are temporary overlays sitting above the main application state.
4.  **Tonal Separation:** Instead of heavy borders, use subtle color shifts (Grey-100 surfaces) to define non-interactive background areas.

## Shapes
The shape language is defined by **Large Roundedness**. All primary containers and cards must use a minimum radius of 16px (rounded-lg) to create a friendly, modern feel that aligns with high-end mobile hardware aesthetics.

- **Cards:** 16px to 24px corner radius.
- **Buttons:** Fully rounded (pill-shaped) or 12px minimum to ensure they feel soft and inviting to touch.
- **Search Bars:** 12px radius to maintain a consistent language with the cards.
- **Icon Enclosures:** Small circular backgrounds for category icons to make them pop against text.

## Components
- **Action Buttons:** Primary buttons are high-saturation Ahorro Green with white text. They should span the full width of their container in mobile views to be easily reachable by the thumb.
- **Trend Cards:** The signature component. Large white cards with 16px+ radius. They feature a prominent price on the left, a "Sparkline" (mini trend graph) in the center, and a percentage change badge on the right.
- **Sparklines:** Simplified, stroke-only charts. Use Trust Blue for general history and Ahorro Green/Error Red for the final "tip" of the line to indicate current trajectory.
- **Search & Filter Chips:** High-contrast grey chips with 32px (pill) radius. Active states toggle to Trust Blue with white text.
- **Price Badges:** Small, rounded containers with high-contrast backgrounds (e.g., Light Green background with Dark Green text) used to highlight "Lowest Price" or "Deal" status.
- **Progressive Disclosure Lists:** Used for store comparisons. A collapsed list showing the best price, which expands to show all nearby retailers with "Map" icons linking to the location.
- **Iconography:** Use "Linear" or "Bold" styles with 2px stroke weights. Avoid overly thin icons; ensure they have enough visual weight to be recognized instantly at 24x24px.