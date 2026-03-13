# Changelog

All notable changes to this project will be documented in this file.

## [2026-03-13]

### Added
- **Redesigned Space Rules System**: 
  - Implemented a database-backed rules system for granular control and persistence.
  - Automatic generation of 10 default rules upon space creation.
  - Integrated in-channel rules management for space owners.
- **Space Deletion Flow**:
  - Added a "Danger Zone" in space settings for secure deletion by owners.
  - Implemented comprehensive backend cleanup to remove all related data (channels, messages, rules, roles).
  - Added a multi-step confirmation dialog and automatic home-page redirection.
- **Improved Space Onboarding**:
  - Refactored space creation into a guided multi-step modal.
  - Added "Default Presets" vs. "Custom Branding" selection.
  - Integrated image uploads and random asset selection for initial branding.
  - New spaces are now private (invite-only) by default for enhanced security.

### Changed
- Refactored `CreateSpaceModal.tsx` and `GeneralTab.tsx` for better UI/UX and alignment with new systems.
- Updated `createSpace` mutation to support initial asset assignment and strict privacy defaults.

### Fixed
- **Missing Database Indices**: Added `by_space` indices to `spaceDailyStats`, `spaceDailyActive`, and `spaceMonthlyActive` to prevent server crashes during data cleanup.
- **Hydration Warnings**: Resolved invalid HTML nesting (`h6` inside `h2`) in MUI Dialog components.
- **Branding Application**: Fixed a bug where branding assets were not correctly saved to the space during creation.

### Removed
- Deprecated legacy `welcome.ts` logic and redundant rules setup dialogs.
