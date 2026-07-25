# 🍊 The Orange Pulp - Project Summary

## 📖 Overview
**The Orange Pulp** is a premium, stylized web destination for cinematic storytelling, editorial reviews, and deep-dive features. It has been built using **Next.js (App Router)** and **TailwindCSS**, heavily stylized with a "Zine" / "Neobrutalist" aesthetic inspired by raw, high-contrast editorial platforms (like Naked Coffee).

---

## 🎨 Design System & Aesthetics

### 1. The Aesthetic: Refined Neobrutalism
The platform eschews soft, generic modern web design in favor of sharp, physical, and assertive styling.
- **Borders:** Thick `3px` solid borders on cards, buttons, and layout containers.
- **Shadows:** Hard, unblurred box shadows (e.g., `8px 8px 0px 0px`).
- **Hover States:** Physical "press" animations where elements translate down-and-right, collapsing the hard shadow to simulate physical interactivity.
- **Typography:** Massive, uppercase, and tightly tracked headings contrasted against highly readable serif/sans-serif body text.

### 2. Color Palette
The color scheme is designed to feel organic, premium, and stark.

| Color Role | CSS Variable | Hex Code | Usage |
| :--- | :--- | :--- | :--- |
| **Background** | `--background` | `#F8F4EA` | Off-white/cream. Used as the global canvas and card backgrounds. |
| **Foreground** | `--foreground` | `#014D2A` | Deep forest green. Used for all text, thick borders, and heavy structural elements. |
| **Primary** | `--primary` | `#F1BDCD` | Soft pastel pink. Used for primary buttons, hover states, and accent blocks. |
| **Secondary** | `--secondary` | `#FF9F1C` | Vibrant orange/yellow. Used for secondary highlights and the word "PULP" in the logo. |
| **Muted** | `--muted` | `#EAE4D3` | Slightly darker cream. Used for ad placeholders and secondary card backgrounds. |

### 3. Typography
- **Heading Font:** `Jost` (usually applied with `font-black`, `uppercase`, and `tracking-widest`).
- **Body Font:** `Inter` (applied with `font-medium` for strong readability).

### 4. Custom CSS Utilities (globals.css)
We created global utility classes to enforce consistency across the app without polluting markup:
- `.brutal-card`: Applies the thick border, off-white background, and 8px hard shadow.
- `.brutal-button`: Applies the dark green background, thick border, and 4px hard shadow. Includes a press animation and color inversion on hover.

---

## 🚀 Features & Systems

### The Intelligent Advertisement System
We built a highly robust, production-ready ad architecture.
- **Centralized Configuration:** Managed in `src/config/ads.ts`. You can toggle individual ad slots, enable development placeholders, and manage Auto Ads from one file without touching UI code.
- **Smart DOM Management:** If a manual ad slot is disabled, it returns `null`. This prevents empty wrappers, preserving the layout and entirely avoiding Cumulative Layout Shift (CLS).
- **Development vs. Production Modes:**
  - *Development:* Shows beautiful, dimension-accurate brutalist placeholders so you can design around ads securely.
  - *Production:* Renders real Google AdSense `<ins>` tags and safely initializes `window.adsbygoogle`.
- **Google Auto Ads Integration:** Safely injected via `AutoAds.tsx` in the root layout to support Anchor and Vignette ads gracefully alongside manual slots.

### UI Components
- **Navbar:** Sticky, frosted-glass header with thick bottom borders, dynamic sliding-block hover animations for links, and a stylized raw text logo.
- **Footer:** Massive, edge-to-edge typography (forced to one line), brutalist hard-shadow social icons, and clean exploration links.
- **Content Cards:** Highly visual, image-heavy layout cards mimicking magazine covers, complete with category pills and author tags.

---

## 🗺️ Routes & Pages

All routes are fully functional and populated with high-quality sample data and cinematic images.

1. **`/` (Homepage)**
   - Massive hero feature with call-to-action.
   - Latest Reviews grid and Industry News list.
   - Newsletter subscription block.
   - Multiple integrated ad slots (Top Billboard, In-Feed Leaderboard, Sticky Sidebar).

2. **`/news`**
   - A dedicated feed for industry shifts and casting announcements.
   - Features a right-aligned sticky sidebar for advertisements.

3. **`/reviews`**
   - A grid layout specifically tailored for movie reviews, featuring rating badges overlapping the cover images.

4. **`/spotlight`**
   - High-impact editorial features using a masonry-style layout. The leading article uses a massive `21:9` cinematic aspect ratio.

5. **`/lists`**
   - A row-based ranking page featuring massive, bold rank numbers on the left and cover images.

6. **`/subscribe`**
   - A dedicated landing page for the OrangePulp newsletter, wrapped in a massive brutalist card.

7. **`/admin`**
   - A sleek content management dashboard.
   - Features a functional drag-and-drop cover image upload zone.
   - Includes form inputs for Title, Category, and Content, all respecting the brutalist design language.
