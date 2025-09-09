# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.5.4] - 2025-09-09

### 🎯 **MAJOR FIXES**
- **CSS Variable Conversion** - Fixed CSS variables to use proper Tailwind arbitrary value syntax
- **Property-Aware Custom Mapping** - Custom theme values now get appropriate CSS property prefixes

### Fixed
- CSS variables now properly wrapped: `var(--palette-background-paper)` → `bg-[var(--palette-background-paper)]`
- Custom theme mapping is property-aware: `theme.custom.main: 'main'` → `text-main` for color, `bg-main` for backgroundColor
- Enhanced ThemeMapper to leverage existing CSS-to-Tailwind conversion logic
- Fixed palette, spacing, and theme fallbacks to generate correct Tailwind classes

### Changed
- All CSS variable references now use Tailwind arbitrary value syntax
- Custom theme mappings automatically get property-specific prefixes
- Improved integration with existing CSS conversion infrastructure

### Technical Details
- Enhanced `ThemeMapper.convertValueToTailwindClass()` method
- Updated fallback generation for palette, spacing, and general theme references
- Comprehensive test suite updates to verify proper CSS variable handling

## [1.5.3] - 2025-09-09

### Changed
- Updated Claude Code assistant instructions for improved development workflow
- Enhanced project documentation and development guidelines

## [1.5.0] - 2025-09-09

### 🎯 **MAJOR FEATURES**
- **Config-based theme mapping with mttwm.config.js support** - Now supports automatic config file loading from project root
- **Enhanced optional chaining handling** - Both `theme.custom?.X` and `theme.custom.X` now work seamlessly with config mappings
- **User-friendly error messages** - Clear guidance on creating config files with practical examples
- **Streamlined npx workflow** - Zero-setup configuration for npx users with helpful error recovery

### Added
- **mttwm.config.js automatic loading** - CLI automatically loads config from project root
- **customThemeMapping support** - Map any theme property to specific Tailwind classes
- **Enhanced error messages** - Step-by-step guidance with real-world examples
- **Both syntaxes supported** - Optional chaining and regular member expressions work identically

### Changed
- **Config-first approach** - Unknown theme properties now require explicit config mapping
- **Improved user experience** - Error messages focus on practical solutions over programmatic API
- **Better documentation** - Updated README with comprehensive config file examples

### Technical Details
- Enhanced ThemeMapper to prioritize customThemeMapping over built-in fallbacks
- Updated CLI to pass config structure correctly to StyleConverter
- Improved parser to handle OptionalMemberExpression and MemberExpression uniformly
- Added comprehensive test coverage for config-based workflows

### Migration Guide
- **For existing users**: No breaking changes to built-in theme properties (`theme.palette.*`, `theme.spacing.*`)
- **For custom properties**: Create `mttwm.config.js` in project root with `customThemeMapping`
- **Error handling**: Follow new error messages for step-by-step config setup

## [1.4.0] - 2025-09-08

### BREAKING CHANGES
- Removed `test` command in favor of simplified `migrate --dry-run` approach
- All testing functionality now uses `mttwm migrate [files...] --dry-run`

### Changed  
- Simplified CLI interface with single `migrate` command for all operations
- Improved user experience with more intuitive command structure
- Updated documentation to reflect streamlined CLI design

### Fixed
- Resolved CLI execution issues with ES modules
- Fixed version display to match package.json version

## [1.3.1] - 2025-09-08

### Fixed
- Fixed CLI not executing due to ES module issues
- Updated CLI version to match package.json
- Improved CLI to accept direct file paths as arguments
- Enhanced error handling and user feedback

## [1.3.0] - 2025-09-08

### Added
- Comprehensive theme spacing conversion support
- Theme.spacing() parser with unit and multiplier support
- StyleConverter integration for theme spacing values
- Dynamic theme spacing expression handling
- Edge case support for mixed spacing with other properties
- Proper Tailwind class generation (p-2, m-4) from theme values

### Fixed
- Resolved 'pxpx' issue in CSS to Tailwind conversion where px units were duplicated
- Enhanced fontSize, borderRadius, and borderWidth mappings to prevent unit duplication
- Fixed empty style removal logic in transformer
- Updated integration test expectations to match corrected behavior
- Fixed vendor prefix handling in CSS conversions

### Changed
- Improved CSS-to-Tailwind mapping functions for better unit handling
- Enhanced test runner with detailed failure reporting
- Updated migration tool behavior for better theme spacing support

## [1.1.0] - 2025-09-04

### Added
- Open source development standards in CLAUDE.md
- Git commit guidelines and conventions
- Semantic versioning documentation
- GitHub changelog maintenance requirements
- Comprehensive testing restructure with integration and unit test suites
- New import resolver functionality

### Changed
- Reorganized test structure from legacy test files to proper Jest test suites
- Enhanced project documentation for open source collaboration
- Updated transformer and migration core functionality

### Removed
- Legacy test files in favor of proper Jest test structure

## [1.0.0] - 2025-09-04

### Added
- Initial release of mttwm (Material To Tailwind Migrator)
- CLI binary for command-line usage
- Comprehensive Jest testing suite
- MIT license
- Core migration functionality for CSS-in-JS to Tailwind CSS
- Support for Material-UI makeStyles migration
- React application migration tools