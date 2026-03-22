# Changelog

## [0.6.0-1] - 2026-03-21

### Added
- **Stripe Integration for Spaces**: Implemented checkout flow for purchasing an expanded spaces tier (up to 100 max spaces). Handled via Stripe Managed Payments (MOR). Added Stripe Customer Portal access to User Settings to allow users to manage their billing and subscriptions directly.
- **Expanded Spaces Badge**: Replaced the 'Upgrade' button with a customized 'Expanded Spaces Active' badge for users who successfully pay.
- **Graceful Downgrade Lifecycle**: Added a resilient subscription failure fallback. Instead of immediately deleting spaces on a failed payment, a 7-day grace period is initiated.
- **Downgrade Cron JobWorker**: A Convex hourly worker `processDowngrades` evaluates downgrade timers strictly.
- **Advanced Notification Engine**:
  - Automatically directly messages users immediately upon subscription deletion.
  - Generates a follow-up 24-hour Final Warning System DM.
  - Enforces the actual deletion rules at exactly the 7-day mark, preserving the oldest 5 spaces and successfully re-capping `maxSpaces`.
- **Global Toast Listener**: Built and injected `<GlobalNotificationListener />` into the app's root layout, actively listening for unread `system_alert` database activities and rendering them as global toasts in real-time.

- **User Profile Integration**: You can now view user profiles directly from the participant context menu in Voice Rooms and the Sidebar.
- **Context-Aware Menus**: The participant context menu now intelligently hides self-actions (Volume, Mention, Block) when right-clicking on yourself.
- **Chat Image E2EE Prototype**: Implemented end-to-end encryption for chat images using a prototype Signal protocol flow. Symmetric file keys are now securely shared between devices using Signal's key fan-out algorithm.
- **Client-Side Media Decryption**: Encrypted images are now decrypted in-browser upon receipt, ensuring that raw media is never stored unencrypted on the server.
- **Chat Attachment Support**: Added a new image attachment button to the chat composer with integrated client-side encryption and upload.
- **Fully Functional Notes App**: A dedicated sidebar-based notes management system integrated into the application shell.
- **Rich Text Editing**: Integrated `react-quill-new` for full WYSIWYG note formatting (Bold, Italic, Lists, Links, etc.) with custom dark-mode styling.
- **Intelligent Auto-Save**: Real-time content synchronization with Convex, featuring a 1-second debounce and a visual "Saving/Saved" status indicator.
- **Note Organization**: Added ability to **Pin** important notes to the top of the sidebar and add comma-separated **Tags** for categorization.
- **Real-Time Metadata**: Integrated live **Word Count** and **Last Edited** timestamps into the editor header.
- **Note Search**: Added a global search bar to the notes sidebar that filters by both title and tags.
- **Custom Delete Modal**: Replaced standard browser alerts with a themed Material UI confirmation dialog for safer note deletion.
- **Accessibility Audit and Remediation**:
  - **Keyboard Navigation**: Added `tabIndex`, `onKeyDown`, and `focus-visible` styles to shared components like `ActionCard`, `GlowPilledButton`, and various dashboard widgets.
  - **ARIA Standards**: Added descriptive `aria-label` attributes to icon-only buttons in the shell (Header, Sidebar, Voice Panel).
  - **Form Accessibility**: Associated labels with input fields (e.g., in Community Actions and Auth Forms) and improved SVG accessibility in the profile card.
  - **Dynamic Content Support**: Added `role="status"` and `aria-label` to real-time notification badges in the Header.
  - **Authentication Screens**: Fixed accessibility in `BannedScreen.tsx` and custom auth flows (`SignInElements.tsx`, `CustomAuthForms.tsx`) by ensuring all inputs have associated labels.

### Fixed
- **MUI Menu Fragments**: Fixed a console error where the `Menu` component received invalid children.
- **Reliable Self-Identification**: Improved "isSelf" detection logic using Convex user data to ensure accurate menu rendering.
- **Voice Room Crash**: Fixed a `ReferenceError` where `spaceId` was undefined in the video grid.
- **Volume Correlation**: Corrected an ID mismatch that prevented user-specific volume settings from applying correctly in some cases.
- **Chat Home Unread Icons**: Resolved an issue where unread message counts were not correctly appearing on chat chips in the Home view.
- **Message Component Nesting**: Fixed a React hydration error caused by invalid DOM nesting (`div` inside `p`) in the chat message thread.
- **React 19 Quill Compatibility**: Resolved a `findDOMNode` error by migrating from `react-quill` to `react-quill-new`.
- **Note Deletion Race Condition**: Fixed a server-side error where auto-save would attempt to patch a note that was immediately deleted.
- **Editor Tooltip Visibility**: Added hovering tooltips to all editor toolbar icons to improve feature discoverability.
- **Dark Mode Picker Visibility**: Fixed an issue where Quill's dropdown menus were invisible in dark mode.
- **Nerdle Variant Persistence**: Fixed an issue where the game variant (Valorant/Minecraft) would persist incorrectly, making it impossible to switch variants without a full refresh.
- **Nerdle Color Standards**: Remapped the game's letter status colors to industry standards: Green now indicates a correct position, matching player expectations.
- **Nerdle Multi-Word Support**: Added support for multi-word guesses (e.g., "TESTERS BLOCK"), correctly validating each word individually against the dictionary.
- **Improved Scoring Accuracy**: Refactored the scoring algorithm using a character-count map to correctly handle duplicate letters in both the guess and answer.