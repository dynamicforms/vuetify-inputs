# DynamicForms Vuetify Inputs Documentation

This directory contains the VitePress documentation for `@dynamicforms/vuetify-inputs`.

## Development

To start the documentation site in development mode:

```bash
# From the root directory
npm run docs:dev

# Or from the docs directory
npm run docs:dev
```

The site will be available at http://localhost:5173/

## Structure

- `.vitepress/` - VitePress configuration
  - `config.ts` - Site configuration: title, navigation, sidebar, Vuetify build setup
  - `theme/` - Custom theme that installs Vuetify and the `DynamicFormsInputs` plugin
- `guide/` - User guide: getting started and the migration guide
- `examples/` - API reference pages, each with interactive examples
- `components/` - Vue components the example pages embed as live demos

## Building

To build the documentation site for production:

```bash
# From the root directory
npm run docs:build
```

The built site will be in the `docs/.vitepress/dist` directory.

## Adding New Examples

1. Create a new Vue component in `components/`
2. Create a new markdown page in `examples/`
3. In that page, add a `<script setup>` block importing the component from `../components/`, and place the component's
   tag where the demo belongs
4. Add the page to the `/examples/` sidebar in `.vitepress/config.ts`
