# Theme references (where to find things)

- **Theme definitions**
  - Directory: `src/theme/registry/`
  - Entry/exports: `src/theme/registry/index.ts` (exports `availableThemes`, `getThemeById()`, `applyTheme()` and all theme modules)
  - Types: `src/theme/registry/types.ts` (`Theme`, `ThemeColors`)
  - Individual themes: files beside the index (e.g., `nightCity.ts`, `voidDark.ts`, `voidDarkRainbow.ts`, etc.)

- **How themes are applied**
  - Function: `applyTheme(theme)` in `src/theme/registry/index.ts`
  - Writes CSS variables on `document.documentElement` for keys like `background`, `card`, `primary`, `secondary`, etc.

- **Where UI consumes themes**
  - Provider: `src/components/home/shell/ShellContent/MainContent/content/theme/content/ThemeProvider.tsx`
    - Reads user setting (`api.users.settings.getSettings`) and applies the selected theme via `applyTheme()`.
  - Gallery UI: `src/components/home/shell/ShellContent/MainContent/content/theme/content/ThemeContent.tsx`
    - Shows four swatches using the theme’s colors: `background`, `card`, `primary`, `secondary`.

- **Voting (Convex) for themes**
  - File: `convex/community/themeVotes.ts`
    - `getAllThemeVoteCounts` → up/down counts for all themes.
    - `getUserVotes` → map of themeId → user's vote ("up" | "down").
    - `castVote` → register a like/dislike.

- **Add a new theme (quick checklist)**
  - Create a new module under `src/theme/registry/` that exports a `Theme` with a unique `id`, `name`, and `colors`.
  - Export it in `src/theme/registry/index.ts` and add to `availableThemes`.
  - Ensure required color keys exist (at least `background`, `card`, `primary`, `secondary`).