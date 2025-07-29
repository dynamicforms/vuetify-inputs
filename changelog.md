# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.4] - 2025-07-29

### Fixed
- df-datetime did not implement the clearable prop

## [0.5.3] - 2025-07-17

### Added
- input retains its value when no v-model and no control is given to hold the value instead

## [0.5.2] - 2025-07-17

### Added
- export props interfaces for the inputs

## [0.5.1] - 2025-06-09

### Added
- Translation support for predefined actions

### Fixed
- Removed breakpoint parameter from predefined actions (it was useless)

## [0.5.0] - 2025-05-31

### Changed
- Refactored Action component to extend Form.Action instead of using it as a property, providing better 
  inheritance and type safety
- Action is now fully responsive with support for breakpoint-based declarations

## [0.4.2 - 0.4.5] - 2025-05-19

### Added
- Reactive choices and value support for df-select component
- New slots (append-inner, prepend-inner) for df-select component customization

## [0.4.0 - 0.4.1] - 2025-05-18

### Fixed
- Uniform input styling across all input-base components
- Error display now only shows after field has been touched, improving user experience
- Proper error rendering with enhanced validation message support

## [0.3.1 - 0.3.3] - 2025-05-17

### Added
- Settings support with configurable input variants (outlined, underlined, etc.)
- Image support in component labels alongside existing icon support

### Fixed
- DateTime component label display issues
- Select component bug where previously selected choices were lost during new searches
- Density and variant processing for df-datetime component

## [0.2.4] - 2025-05-13

### Changed
- Reorganized dropdown layouts for better user experience

## [0.2.3] - 2025-05-08

### Added
- Exported getBreakpointName function for external use

## [0.2.1 - 0.2.2] - 2025-05-04

### Fixed
- Type declarations and member visibility improvements
- Generic solution for ResponsiveRenderOptions with correct exports

## [0.1.11 - 0.1.15] - 2025-04-21

### Changed
- Simplified select component due to variant changes
- Unified input heights across all components
- Enhanced message widget to support hints and help text

### Fixed
- Number input demo styling issues
- Precision handling (null when undefined)
- Selection clearing functionality in df-select component

### Removed
- Redundant form data handling

### Added
- Proper styles declaration

## [0.1.7 - 0.1.10] - 2025-04-19

### Fixed
- Color picker closing behavior - no longer closes on every internal click
- Checkbox unnecessary value reassignments
- DateTime values now include timezone information

### Changed
- Updated repository URL
- Excluded Vuetify components from package bundle for smaller distribution size

## [0.1.0 - 0.1.6] - 2025-04-18

### Added
- Initial implementation with three example components
- Helper classes for component development
- Complete documentation with working examples
- Integration with @dynamicforms/vue-forms
- TypeScript support
- Vuetify-based styling
- df-date-time component with full Vuetify integration
- df-textarea component with configurable rows and auto-grow
- df-file component with upload progress indication
- df-select component with static/dynamic options and multiple selection
- InputBase foundation component for all inputs
- Visibility support for textarea and select components
- Clearable functionality for input-base
- df-input component for general text input
- Support for multiple input types (text, email, password, URL, number)
- df-color component for color selection
- df-checkbox component with binary and ternary state support
- df-rtf-editor component with CKEditor integration
- df-actions component moved from separate package for better integration
- MDI font requirement for icons
- Advanced validation rendering supporting string, Markdown, and custom components
- Vue-forms validation support
