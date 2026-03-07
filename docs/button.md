# Buttons in EcoSystem

This document profiles the button components and patterns used across the shell and content areas.

## Button families

- **Material UI Button (`@mui/material/Button`)**
- **Material UI IconButton (`@mui/material/IconButton`)**
- **Native HTML `<button>` with Tailwind/utility classes**
- **Custom Glow Buttons**
  - `GlowCircularButton` (`src/components/ui/GlowCircularButton.tsx`)
  - `GlowPilledButton` (`src/components/ui/GlowPilledButton.tsx`)

---

## Material UI Button

- **Where used**
  - `src/components/home/shell/ShellContent/MainContent/content/home/HomeContent.tsx`
  - `src/components/home/shell/ShellContent/MainContent/content/chat/content/header/GroupSettingsModal.tsx`
- **Common patterns**
  - Variants: `contained`, `outlined`.
  - Color: uses theme CSS variables (e.g., `var(--primary)`, `var(--buttonPrimary)`), plus MUI `color="error"` in destructive actions.
  - Sizing: mostly default or `size="small"` in dialogs.
  - Loading: `startIcon={<CircularProgress size={...} />}`.
- **Styling**
  - Inline `sx` references design tokens: `--buttonPrimary`, `--buttonPrimaryHover`, `--buttonPrimaryActive`, `--border`, `--text*`.
- **Usage examples**
  - Primary call-to-action: `HomeContent.tsx` uses `variant="contained"` with custom background and hover tokens.
  - Dialog actions: `GroupSettingsModal.tsx` uses `contained` for primary and `outlined color="error"` for destructive.

## Material UI IconButton

- **Where used**
  - `src/components/home/shell/ShellContent/header/content/index.tsx`
  - `src/components/home/shell/ShellContent/LeftSidebar/content/index.tsx`
- **Common patterns**
  - Small toggles with lucide icons (e.g., `PanelLeft`, `PanelRight`, `Home`).
  - Hover states blend theme color with transparency via `color-mix`.
  - Size: `size="small"` frequently.

## Native HTML `<button>` (utility classes)

- **Where used**
  - `src/components/home/shell/ShellContent/MainContent/content/friends/FriendsHeader.tsx`
  - `src/components/home/shell/ShellContent/MainContent/content/friends/FriendsList.tsx`
- **Common patterns**
  - Shapes: `rounded-2xl` (pills) and `rounded-full` (circular icon action).
  - Colors: semantic backgrounds (`bg-blue-600`, `bg-green-600`, `bg-red-600`, `bg-zinc-800`) and variables via inline `style`.
  - Interaction: `hover:*`, `disabled:*`, and explicit mouse handlers to toggle pressed styles (see `FriendsHeader.tsx`).
  - Badges: absolute-positioned notification dots with count (see pending filter in `FriendsHeader.tsx`).
- **Usage examples**
  - Filters as pills with active state using `var(--primary)` border/background.
  - Conversation actions as circular icon buttons in `FriendsList.tsx`.

## Custom Glow Buttons

### GlowCircularButton

- **File**: `src/components/ui/GlowCircularButton.tsx`
- **Purpose**: Compact circular icon button with glow effect.
- **Key props**
  - `glowColor?: string` — sets CSS custom prop `--glow-color`.
  - All standard `button` props and `children` for the icon.
- **Behavior**
  - Inline style sets size `40x40`, `borderRadius: '50%'`.
  - Press feedback via `onMouseDown`/`onMouseUp` (scales to 0.95 then resets).
  - Exposes `glowCircularNotificationBadgeClass` to style a notification badge via CSS Module.

### GlowPilledButton

- **File**: `src/components/ui/GlowPilledButton.tsx`
- **Purpose**: Pill-shaped CTA with animated glow that follows the cursor.
- **Key props**
  - `glowColor?: string` — optional glow color.
  - `icon?: React.ReactNode` — leading icon.
  - `label?: string` — text label.
  - `children?: React.ReactNode` — custom content if needed.
  - `contentGap?: number` — spacing between icon and label in px.
  - `iconSize?: number` — size for the embedded icon in px.
- **Behavior**
  - Updates CSS vars `--glow-pos-x`/`--glow-pos-y` on `onMouseMove` for hotspot glow.
  - Resets glow on `onMouseLeave`.

---

## Design tokens and theming

- **CSS variables** used across buttons: `--primary`, `--buttonPrimary`, `--buttonPrimaryHover`, `--buttonPrimaryActive`, `--secondary`, `--border`, `--text`, `--textPrimary`, `--textSecondary`, `--danger`, `--card`, `--foreground`, `--shadow`, `--overlay`.
- **Blend/hover effects**: `color-mix(in oklab, token, transparent X%)` for subtle hover backgrounds on IconButtons and lists.

## States and accessibility

- **Focus/hover/active**
  - MUI handles focus-rings; utility buttons should ensure visible focus (currently many rely on hover/active colors and outline: none). Consider adding a consistent focus style.
- **Disabled**
  - MUI: `&:disabled` styles via `sx` (e.g., dim background).
  - Native: `disabled:*` Tailwind utilities and `disabled` attribute where applicable.
- **Keyboard**
  - Some navigational list items use `role="button"` and `onKeyDown` for Enter/Space (`LeftSidebar/content/index.tsx`). Prefer actual `<button>` when feasible for built-in semantics.

## When to use which

- **Use MUI Button/IconButton**
  - For dialogs, headers, and areas already using MUI layout/typography. Quicker consistency, built-in a11y.
- **Use native `<button>` with utilities**
  - For list actions and compact, highly customized visuals where you need precise Tailwind class control.
- **Use Glow buttons**
  - For prominent CTAs with a neon/glow feel, or circular icon actions that should visually stand out.

## References (sample)

- **Header**: `src/components/home/shell/ShellContent/header/content/index.tsx`
- **Left sidebar**: `src/components/home/shell/ShellContent/LeftSidebar/content/index.tsx`
- **Friends header**: `src/components/home/shell/ShellContent/MainContent/content/friends/FriendsHeader.tsx`
- **Friends list**: `src/components/home/shell/ShellContent/MainContent/content/friends/FriendsList.tsx`
- **Group settings modal**: `src/components/home/shell/ShellContent/MainContent/content/chat/content/header/GroupSettingsModal.tsx`
- **Home landing CTA**: `src/components/home/shell/ShellContent/MainContent/content/home/HomeContent.tsx`

## Notes and next steps

- **Unify focus styles** across native and MUI buttons for consistent accessibility.
- **Centralize button tokens** in a single theme map if we keep mixing native/MUI for easier theme tweaks.
- **Document CSS Modules** for glow button styles (`GlowCircularButton.module.css`, `GlowPilledButton.module.css`) alongside this doc for implementers.
