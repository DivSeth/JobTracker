# Design System Strategy: The Focused Architect

## 1. Overview & Creative North Star
The "Job Application OS" is more than a database; it is a high-stakes command center. Our Creative North Star is **"The Digital Curator."** 

This system moves away from the chaotic, "boxy" nature of traditional SaaS and towards a refined, editorial layout. We are blending the utilitarian density of Linear with the spatial intentionality of Notion. To break the "template" look, we use intentional asymmetry—wide margins on one side, compact action panels on the other—and high-contrast typography scales. The goal is an atmosphere of "Quiet Authority": professional, focused, and unmistakably premium.

---

## 2. Colors & Tonal Depth
We do not use color to decorate; we use it to direct focus. Our palette is anchored in neutrals to allow the user’s career data to take center stage.

### The "No-Line" Rule
**Explicit Instruction:** Prohibit the use of 1px solid borders for sectioning. Structural boundaries must be defined solely through background shifts.
*   **Surface-to-Surface transition:** A `surface-container-low` sidebar sitting directly against a `surface` main stage creates a sophisticated, "borderless" division.

### Surface Hierarchy & Nesting
Think of the UI as a series of physical layers—stacked sheets of fine paper or frosted glass.
*   **Base:** `surface` (#f7f9fb)
*   **Secondary Layouts:** `surface-container` (#e8eff3)
*   **Interactive Cards:** `surface-container-lowest` (#ffffff)
*   **Depth Principle:** Nest `surface-container-lowest` (pure white) cards inside `surface-container-low` sections to create a soft, natural lift without the "heaviness" of a border.

### The "Glass & Gradient" Rule
To elevate the system, floating elements (modals, dropdowns, command menus) should utilize **Glassmorphism**.
*   **Tokens:** Use `surface_container_lowest` with 80% opacity and a `20px` backdrop-blur.
*   **Signature Textures:** For primary CTAs, use a subtle linear gradient from `primary` (#0053db) to `primary_dim` (#0048c1) at a 135-degree angle. This adds "soul" and prevents the action from feeling like a flat digital block.

---

## 3. Typography: Editorial Hierarchy
We use **Inter** as our typographic workhorse. The system relies on drastic scale shifts to imply importance rather than heavy weights.

*   **Display (The Statement):** `display-lg` (3.5rem) is reserved for empty states or major dashboard milestones. It should be tracked in (-0.02em) to feel tight and premium.
*   **Headline (The Narrative):** `headline-sm` (1.5rem) uses Medium weight to define new sections.
*   **Body (The Utility):** `body-md` (0.875rem) is the default for all application data. 
*   **Label (The Metadata):** `label-sm` (0.6875rem) in All-Caps with 0.05em letter spacing is used for status tags (e.g., "APPLIED", "INTERVIEWING") to provide a "technical" contrast to the editorial headlines.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are too heavy for a "minimalist OS." We use light and tone to imply z-index.

*   **The Layering Principle:** Place a `surface-container-lowest` card on top of a `surface-container-low` background. This creates a "soft lift" that feels organic.
*   **Ambient Shadows:** When a floating effect is required (e.g., a dragged job card), use an extra-diffused shadow: `0 12px 40px rgba(42, 52, 57, 0.06)`. Note the color: the shadow is a tinted version of `on-surface`, never pure black.
*   **The "Ghost Border" Fallback:** If a boundary is strictly required for accessibility, use the `outline_variant` token at **15% opacity**. High-contrast, 100% opaque borders are strictly forbidden.

---

## 5. Components: Clean & Intentional

### Buttons
*   **Primary:** Gradient of `primary` to `primary_dim`. Roundedness: `lg` (1rem). 
*   **Secondary:** `surface-container-high` background with `on-surface` text. No border.
*   **Tertiary:** Ghost style. `on-surface-variant` text that shifts to `on-surface` on hover.

### Cards & Lists
*   **No Dividers:** Forbid the use of 1px lines between list items. Use the **Spacing Scale `3` (1rem)** or `3.5` (1.2rem) to create separation through white space.
*   **Hover State:** Cards should transition from `surface-container-lowest` to a subtle `surface-container-high` on hover, mimicking the "press" of a physical button.

### Input Fields
*   **Refined Inputs:** Use `surface-container-lowest` for the field background. The label should be `label-md` placed 0.5rem above the input.
*   **Focus State:** Instead of a heavy border, use a 2px outer glow (using `primary` at 20% opacity).

### Specialized Components
*   **The Kanban Tile:** A `surface-container-lowest` card with a `4px` left-accent bar using the status color (e.g., `tertiary` for "Offer"). 
*   **The Timeline Rail:** For application history, use a vertical `outline_variant` line at 20% opacity with `surface-tint` dots.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use extreme white space. If you think there is enough padding, add 0.5rem more.
*   **Do** use `surface-container-highest` for "Selected" states in the sidebar.
*   **Do** use `soft-rounded corners (12px-16px)` for all containers to maintain the "Soft Minimalism" feel.

### Don't:
*   **Don't** use pure black (#000). Use `on_surface` (#2a3439) for all "black" text to maintain the charcoal, premium feel.
*   **Don't** use standard "drop shadows" on every card. Rely on background color shifts first.
*   **Don't** use 100% opaque borders. They clutter the visual field and break the "Digital Curator" aesthetic.