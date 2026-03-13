# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0-9] - 2026-03-13

### Added
- **Theme Gallery Expansion**: Introduced "Warm" and "Cool" theme classification tabs in the Theme Studio for better discoverability.
- **New Warm Themes**: Sunset Glow, Desert Oasis, and Autumn Ember (including Light/Dark variants).
- **New Cool Themes**: Arctic Frost, Deep Sea, and Midnight Nebula (including Light/Dark variants).

### Changed
- **Profile Experience Optimization**: Holistically refactored the Profile module (Header, Overview, Achievements, Activity) to use standardized theme tokens (`foreground`, `primary`) instead of legacy variables.
- **Cyberpunk Theme Rework**: Transformed "Cyberpunk Light" into a high-vibrancy "Hacked Light" aesthetic with neon cyan/magenta accents and a signature yellow background.
- **Pride Theme Refinement**: Enhanced the Pride Light theme with a more representative color palette and softer backgrounds.
- **Night City Theme Polish**: Infused Night City Light with deeper purple tones for a more distinct and aesthetic identity.
- **Footer-Header Alignment**: Synchronized the footer's styling with the header, ensuring consistent text visibility and border styling across all themes.

### Fixed
- **Header Legibility**: Fixed a contrast issue in Night City Light by darkening the foreground and syncing with the sidebar theme.
- **Dashboard Visibility**: Resolved "invisible" text in Daily Challenges when using light modes by applying correct theme-aware foreground tokens.
- **Legacy Variable Purge**: Removed remaining instances of `var(--textLight)` and hardcoded `rgba` values from the Profile and Shell components.
- **Nerdle Main Alignment**: Fixed padding and theme consistency in the Nerdle game entry points.

## [0.2.0] - 2026-03-12

### Added
- **Home Dashboard**: Transformed the static Home screen into a dynamic dashboard featuring:
    - Personalized welcome greeting with user display name.
    - **Recent Spaces Widget**: Quick access to joined spaces.
    - **Daily Challenges Widget**: Real-time status of Nerdle variants (Valorant/Minecraft).
    - **DashboardCard Component**: New shared component for consistent widget styling.
    - **Deep-linking Infrastructure**: Added `selectedDailyId` and `nerdleVariant` to `viewContext.tsx`, allowing direct navigation to specific game boards.
- **Space Name Uniqueness**: Enforced unique space names in the Convex backend (`createSpace` and `updateSpaceMetadata`).
- **Space Settings (General)**: Added "Space Name" editing section to `GeneralTab.tsx`.
- **Space Management (Modals)**: (In Progress) Moving channel and category creation to premium modals in `ChannelsTab.tsx`.

### Changed
- **Dailies Hub**:
    - Refactored the internal header to use themed `Button` components instead of raw HTML buttons, improving consistency.
    - Updated "Dungeon Deal" status to "Coming Soon".
    - Cleaned up the "Back" button and navigation logic in `DailiesContent.tsx`.
- **Nerdle Leaderboard**: Refactored `LeaderboardModal.tsx` to match the premium modal design (backdrop blur, 9px radius, shared headers, and `themeVar` usage).
- **Home View**: Completely redesigned `HomeContent.tsx` as a functional dashboard hub.
- **Friends List**: Fixed "trash" button styling in the friends list by removing `w-full` from `UiIconButton` and ensuring square dimensions and centering.
- **Space Creation**: Removed the "Public Space" toggle from the `CreateSpaceModal.tsx`.
- **Unified Modal Styling**: Synchronized `NewChatModal.tsx`, `GroupSettingsModal.tsx`, and the "Report Message" dialog in `ChatThread.tsx` for consistent premium UI (backdrop blur, 9px radius, shared headers).
- **Theme Standardization**: Replaced hardcoded `var(--border)`, `var(--primary)`, etc., with the standardized `themeVar()` helper across the chat module.
- **Spaces UI Refinement**: Standardized internal padding and layout in `GeneralTab.tsx` to match the platform's premium design language.

### Fixed
- **Nerdle Game**: Resolved various `current_problems` in `NerdleGameBoard.tsx` and `NerdleMain.tsx`.
- **Group Settings Bug**: Restored missing `Tab` import in `GroupSettingsModal.tsx`.
- **Type Safety**: Resolved several TypeScript linting errors regarding theme variables and optional properties.
