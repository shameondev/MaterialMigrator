# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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