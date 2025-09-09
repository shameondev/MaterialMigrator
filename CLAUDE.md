# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive React-based analytics and management dashboard built with TypeScript, Vite, and Material-UI. The application provides features for analytics visualization, customer management, A/B testing, product management, and a no-code builder interface.

## Essential Development Commands

### Development & Build
```bash
npm run dev                 # Start development server on port 3000
npm run build              # Production build to /build directory  
npm run serve              # Preview production build
npm run typecheck          # TypeScript type checking (run before commits)
```

### Code Quality (Always run before task completion)
```bash
npm run check:ci           # Full Biome check with error-level diagnostics
npm run lint               # Lint with Biome
npm run lint:fix           # Auto-fix linting issues
npm run format:fix         # Format and fix code style issues
```

### Testing
```bash
npm run test               # Run Jest unit tests
npm run test:coverage      # Generate coverage report
npm run cypress:open       # E2E testing with Cypress UI
npm run cypress:run        # Run Cypress tests headlessly
```

### Component Development
```bash
npm run storybook          # Start Storybook on port 6006
npm run build-storybook    # Build Storybook for deployment
```

## Architecture & Code Organization

### Key Directories
- **`src/components/`** - Reusable UI components with co-located styles and hooks
- **`src/views/`** - Page-level components organized by feature domain  
- **`src/services/`** - API services and data layer, organized by domain
- **`src/store/`** - Redux-like state management with domain-specific slices
- **`src/hooks/`** - Custom React hooks following `use*` naming convention
- **`src/theme/`** - Material-UI theme configuration and customizations
- **`src/utils/`** - Shared utility functions and helpers

### Component Patterns
- Each component in its own directory with `index.ts` barrel exports
- Separate `styles.ts` files for Material-UI styled components  
- Co-located hooks, utils, and types within component directories
- TypeScript interfaces/types defined in `.d.ts` files or inline

### State Management
- Domain-specific store slices (ui, charts, analytics, customers, etc.)
- Actions, reducers, and selectors pattern for complex state
- Custom hooks for component-level state management
- Service layer handles API calls and data transformations

## Code Style & Quality

### TypeScript Configuration
- ES2022 target with ESNext modules and strict mode enabled
- Full type checking with declaration files generated
- Use `import type` syntax for type-only imports

### Tools & Standards
- **Biome** for linting, formatting, and code analysis (replaces ESLint + Prettier)
- **Jest** for unit testing with comprehensive coverage reporting
- **Cypress** for E2E testing and integration tests
- **Storybook** for component development and documentation

### Task Completion Checklist
When completing any development task, always run:
1. `npm run typecheck` - Ensure no TypeScript errors
2. `npm run check:ci` - Run full Biome checks  
3. `npm run test` - Verify all tests pass
4. `npm run build` - Confirm production build succeeds

## Open Source Standards

This is **open source software** following industry best practices:

### Git Commit Standards
- **Meaningful commits**: Each commit must be self-explaining and describe the "why" not just the "what"
- **Atomic changes**: One logical change per commit for clean history and easier rollbacks
- **Descriptive messages**: Use conventional commit format when possible (feat:, fix:, docs:, etc.)

### Version Management
- **Semantic Versioning**: Follow SemVer (MAJOR.MINOR.PATCH) for all releases
- **Git Tagging**: Before publishing, create a git tag with the version number using `git tag v<version>`
- **GitHub Changelog**: Maintain comprehensive changelog documenting all notable changes
- **Release Notes**: Document breaking changes, new features, and important fixes

### Release Process
Before publishing a new version:
1. Update version number in `package.json` and `src/cli.ts`
2. Update CHANGELOG.md with new version and release notes
3. Create git tag: `git tag v<version>` (e.g., `git tag v1.5.2`)
4. Push tag to remote: `git push origin v<version>`
5. Publish to npm registry

### Documentation
- Keep README.md current with installation and usage instructions
- Update CHANGELOG.md for each release with categorized changes
- Maintain clear contribution guidelines for community contributors

## Material-UI Integration

The project uses Material-UI v5+ with:
- Custom theme configuration in `src/theme/`
- Styled components using Material-UI's styling solutions
- Responsive breakpoints and custom color palette
- Component-specific styles in co-located `styles.ts` files

## Testing Strategy

- **Unit Tests**: Jest with `.test.ts` suffix in `__tests__` directories or co-located
- **E2E Tests**: Cypress configuration in `cypress.config.mjs`  
- **Component Tests**: Storybook stories for visual testing and documentation
- **Coverage**: Full coverage reporting enabled with exclusion patterns