# Changelog

## [0.0.0-10] - 2026-03-13

### Added
- **Signal Protocol E2EE**: Integrated End-to-End Encryption for chat messages with multi-device support.
- **Multi-Device Sync**: Decentralized key management via IndexedDB for secure fan-out encryption.
- **Group Size Limits**: Enforced and displayed a 10-participant limit for group chats.
- **Member Management**: Added "Add Member" and member list with "Kick" and "Transfer Ownership" functionality for group owners.
- **Auto-Ownership Transfer**: Ownership now automatically transfers to an admin or member if the current owner leaves.
- **Group Customization**: Functional group avatar uploads and name editing.

### Changed
- **Theme Optimization**: Removed `borderLight` from `valorant.ts` to satisfy TypeScript types and resolve build warnings.

### Removed
- **Message Reporting**: Removed the reporting feature as it is incompatible with end-to-end encrypted content.
