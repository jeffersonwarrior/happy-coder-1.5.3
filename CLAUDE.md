# CLAUDE.md

## Repository & Git Organization

**IMPORTANT**: This is a LOCAL development environment, not remote!

### Git Remote Structure:

- **Local machine**: `/opt/happy-coder/` (where Claude works)
- **jeffersonwarrior's fork**: https://github.com/jeffersonwarrior/happy-coder-1.5.3.git (remote target)
- **True origin**: https://github.com/slopus/happy (original project)

### Current Setup:

- Working locally on `feature/happy-coder-1.5.3` branch
- When committing: `git commit` = LOCAL commit
- When pushing: `git push fork-1.5.3 feature/happy-coder-1.5.3` = push to jeffersonwarrior's fork
- Attribution maintained to upstream `slopus/happy` project

### Workflow:

1. Develop locally on feature branches
2. Commit locally first
3. Push to jeffersonwarrior's fork (`fork-1.5.3` remote)
4. PR to upstream `slopus/happy` when ready

- NEVER modify remote URLs once configured

## Version Management

- **Version source**: `version.txt` file (currently 1.5.3)
- **Usage**: `app.config.js` reads from `version.txt`, `package.json` has note reference
- **Updates**: Change version.txt only, other files will use it automatically

## Requirements

### Happy CLI Version

- **Minimum CLI version**: 0.11.0 for full 1.5.3 features
- **Key features requiring 0.11.0+**: Git status sync, file browser, remote session management
- **Check CLI version**: `happy --version`
- **Update CLI**: `npm install -g happy-coder@latest`

## Commands

- `yarn start` - Start Expo dev server
- `yarn typecheck` - Run TypeScript checking (required after all changes)
- `yarn ota` - Deploy OTA updates to production
- `npx tsx sources/scripts/parseChangelog.ts` - Regenerate changelog after CHANGELOG.md updates

## Tech Stack

React Native + Expo SDK 53, TypeScript (strict), Unistyles, Expo Router v5, Socket.io, tweetnacl encryption

## Critical Rules

- **Always use `t()` for user-visible strings** - import from `@/text`, add to ALL languages (en/ru/pl/es)
- **Never use React Native Alert** - use `@sources/modal/index.ts`
- **4 spaces indentation**, **yarn** (not npm), path alias `@/*` → `./sources/*`
- **Apply layout width constraints** from `@/components/layout` for responsive design
- **Store temp scripts** in `sources/trash/` folder
- **Set screen params in \_layout.tsx** to avoid layout shifts

## Architecture

- **Auth**: QR code-based with expo-camera
- **Sync**: WebSocket real-time with tweetnacl encryption
- **State**: React Context (auth), custom reducer (sync)
- **Structure**: `sources/{app,auth,components,sync,utils}/`

## Styling (Unistyles)

```typescript
import { StyleSheet } from 'react-native-unistyles';

const styles = StyleSheet.create((theme, runtime) => ({
  container: {
    backgroundColor: theme.colors.background,
    padding: theme.margins.md,
  },
}));
```

- Use `StyleSheet.create` from unistyles
- Provide styles directly to RN components
- Use `useStyles` hook only for non-RN components
- Expo Image: size props inline, tintColor on component

## Changelog

Update `/CHANGELOG.md` with user-friendly descriptions, then run parseChangelog script. Format: `## Version [N] - YYYY-MM-DD`

## i18n

- Check `common.*` first before adding keys
- Use contextual sections: `settings.*`, `errors.*`, `session.*`, `modals.*`, `components.*`
- Add to all languages, use i18n-translator agent for consistency
- Language config in `sources/text/_all.ts`

## Important Files

- `sources/sync/types.ts` - Sync protocol types
- `sources/auth/AuthContext.tsx` - Auth state
- `sources/app/_layout.tsx` - Root navigation
- Custom header: `sources/components/Header.tsx` with NavigationHeader
