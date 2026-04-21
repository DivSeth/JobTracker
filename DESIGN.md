```markdown
# Design System Specification: The Cognitive Workspace

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Intelligent Curator."** This isn't just a job tracker; it is an organized, high-fidelity OS for a user's professional evolution.

To move beyond the generic "SaaS template" look, this design system rejects the standard 1px box-model in favor of **Tonal Architecture**. We build hierarchy through a series of nested, soft-edged planes that feel physical and intentional. By leveraging generous whitespace (as seen in the reference "Job Feed" and "Insights" views) and asymmetric layouts, we create a calm, editorial experience that feels more like a premium portfolio than a cluttered database.

## 2. Colors & Surface Architecture

### The "No-Line" Rule
Traditional dividers and 1px borders are strictly prohibited for sectioning. Structural definition must be achieved through:
1. **Background Shifts:** Using `surface-container-low` (#f0f4f7) to house elements against a `surface` (#f7f9fb) backdrop.
2. **Shadow Depth:** Using diffused light to lift elements.
3. **Negative Space:** Utilizing the `spacing-8` (2.75rem) or `spacing-10` (3.5rem) tokens to group related content logically.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked premium paper layers.
* **Base:** `surface` (#f7f9fb) for the primary application background.
* **Primary Containers:** `surface-container-lowest` (#ffffff) for the highest-priority cards and interactive modules.
* **Sub-sections:** `surface-container` (#e8eff3) for secondary grouping elements or sidebars.

### Glass & Gradient Transitions
For floating action panels or navigation rails, use Glassmorphism.
* **Backdrop Blur:** 12px – 20px.
* **Fill:** `surface` at 80% opacity.
* **Signature Polish:** Hero buttons (Primary) should use a subtle linear gradient from `primary` (#005ac2) to `primary_dim` (#004fab) to prevent the "flat" look and add a sense of tactile premium quality.

## 3. Typography
We utilize a dual-typeface system to balance authority with readability.

* **The Authority (Manrope):** Reserved for `display` and `headline` tiers. Manrope’s geometric but warm terminals provide an "Intelligent" personality.
* *Usage:* Large stats in "Insights" or Page Titles (e.g., "Application Pipeline").
* **The Utility (Inter):** Used for `title`, `body`, and `label` tiers. Inter provides maximum legibility for dense job descriptions and data fields.
* *Hierarchy Tip:* Always pair a `headline-md` (Manrope) with a `body-md` (Inter) for an editorial, high-contrast look.

## 4. Elevation & Depth

### The Layering Principle
Avoid "shadow-heavy" designs. Instead, achieve lift by placing `surface-container-lowest` (#ffffff) components on top of `surface-container-low` (#f0f4f7) backgrounds. This creates a "soft-lift" effect that feels calm and organized.

### Ambient Shadows
When an element must float (e.g., a modal or a primary CTA):
* **Shadow Color:** Use a tinted version of `on-surface` (#2a3439) at 6% opacity.
* **Blur:** Use large values (30px - 50px) to simulate natural, ambient light rather than a harsh, artificial drop shadow.

### The "Ghost Border"
If a container requires a boundary (e.g., job cards in a grid), use a **Ghost Border**:
* **Value:** `outline-variant` (#a9b4b9) at **15% opacity**. It should be felt, not seen.

## 5. Components

### Primary Buttons
* **Style:** `rounded-lg` (0.5rem), high-contrast `primary` fill.
* **Interaction:** On hover, transition to `primary_dim`.
* **Typography:** `label-md` (Inter) in Semi-Bold.

### Content Cards
* **Constraint:** No borders. No internal dividers.
* **Styling:** Background of `surface-container-lowest`.
* **Padding:** Use `spacing-4` (1.4rem) for internal breathing room.
* **Accent:** Use a 4px vertical "Indicator Strip" of a semantic color (e.g., `primary` or `tertiary`) on the far-left edge to denote status without cluttering the card face.

### Inputs & Text Areas
* **Background:** `surface-container-lowest` (#ffffff).
* **Border:** Ghost Border (15% `outline-variant`).
* **Focus State:** 2px solid `primary` or a 4px soft glow using the `primary_container` color.

### Progress & Status Indicators
* **Bar Thickness:** Keep bars slim (4px to 8px) with `full` rounding to maintain a "Modern/Apple" aesthetic.
* **Tonal Logic:** Use the `container` variants (e.g., `tertiary_container`) for the track and the base color (e.g., `tertiary`) for the fill.

## 6. Do's and Don'ts

### Do:
* **Embrace Asymmetry:** In the "Insights" dashboard, allow for varying card widths to create a dynamic, editorial feel.
* **Use Subtle Shifts:** Define the sidebar from the main content area using only a shift from `surface` to `surface-container-low`.
* **Prioritize Whitespace:** If a layout feels "busy," increase the spacing between elements rather than adding lines or borders.

### Don't:
* **No 100% Opaque Borders:** Never use a solid, dark border. It breaks the "Calm" brand personality.
* **No Pure Black Shadows:** Shadows must always be tinted with the surface's blue-gray tones to maintain a premium feel.
* **No Default "Gray" Text:** Use `on-surface-variant` (#566166) for secondary text to keep the interface feeling "Intelligent" and warm, rather than sterile.
* **No Divider Lines:** In lists or cards, separate items using the `spacing-2` (0.7rem) or `spacing-3` (1rem) tokens as empty space.```