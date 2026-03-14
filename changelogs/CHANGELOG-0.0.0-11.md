# Changelog

## [0.0.0-11] - 2026-03-14


### Added
- **Right-Click Context Menu**: Implemented a context menu for voice participants in the sidebar and video tiles.
- **Individual Volume Control**: Users can now adjust individual participant volumes; settings are persisted via Convex.
- **Audio-Only Presence UI**: Automatically switches to a grid of animated avatars when no video/screenshare is active.
- **Manual Stage Pinning**: Enabled pinning any participant to the main stage via click.
- **Visual Speaking Indicators**: Added green "speaking" rings and pulse animations to both sidebar rows and main participant tiles.

### Fixed
- **Carousel Stability**: Resolved the "Element not part of the array" crash by forcing component resets on track changes.
- **Speaking Latency**: Switched to `useIsSpeaking` hook for sub-millisecond feedback on voice activity.
- **VoiceRoom Speaking Indicator**: Fixed a "Cannot find name 'isSpeaking'" crash in video tiles by correctly implementing the `useIsSpeaking` hook.
- **Runtime Error Guards**: Added safety checks for `setVolume` and `VideoTrack` rendering to prevent UI crashes.
- **Convex Sync Errors**: Fixed a renamed mutation mismatch (`updateUserSettings`) across the settings and theme components.
- **Hardware Constraint Mitigation**: Added error handling for `OverconstrainedError` in media device selection.
- **Identity Mismatch**: Fixed an issue where the sidebar didn't recognize who was speaking due to mismatched user IDs.

### Changed
- **Stage Layout**: Improved the Grid View to use 2-3 columns (Zoom-like) for better space utilization.
- **Screenshare Priority**: Refined auto-pinning logic to focus on new screenshares without disrupting manual pins.
- **Layout Defaults**: Switched the default initial view to Grid Mode for a better audio-first experience.

