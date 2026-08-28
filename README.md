# @kokku/wp-build-preset

Shared build tooling for Kokku WordPress themes:

- **`index.js`** — a webpack preset over `@wordpress/scripts`.
- **`.github/workflows/wp-theme-release.yml`** — a reusable release workflow.

Both exist so that fixing either is one pull request instead of the same edit
repeated across every client theme.

## Webpack preset

```js
// webpack.config.js
module.exports = require('@kokku/wp-build-preset')(__dirname);
```

Expects `src/js/main.js` as the entry (importing the theme's SCSS) and outputs
to `dist/`. Extra entries are opt-in:

```js
const path = require('path');

module.exports = require('@kokku/wp-build-preset')(__dirname, {
	entry: { blocks: path.resolve(__dirname, 'src/js/blocks/blocks.js') },
	rtl: false, // default
});
```

Install:

```
npm install --save-dev git+https://github.com/Kokku/kokku-wp-build-preset.git#v1
```

`@wordpress/scripts` and `css-minimizer-webpack-plugin` are peer dependencies.

## Release workflow

```yaml
name: Release
on:
  push:
    tags: ["v*"]
permissions:
  contents: write
jobs:
  release:
    uses: Kokku/kokku-wp-build-preset/.github/workflows/wp-theme-release.yml@v1
    with:
      slug: my-child-theme
      has-build: false
```

| Input | Default | |
|---|---|---|
| `slug` | *required* | Theme folder name; must match the release asset the updater expects |
| `has-build` | `false` | Run `npm ci` and `npm run build` |
| `has-composer` | `false` | Run `composer install --no-dev` and ship `vendor/` |
| `php-version` | `8.3` | Only used with `has-composer` |
| `build-outputs` | `dist/main.css`, `dist/main.js` | Files that must exist after the build |
| `extra-paths` | — | Extra paths to include in the ZIP |

The ZIP is built from an allowlist, so anything new in a repo ships only if it
is added deliberately. Paths absent from a given theme are skipped rather than
failing the build.

## Versioning

Consumers pin `@v1`. Move the `v1` tag forward for backwards-compatible
changes; cut `v2` for anything that breaks a caller.

## Documentation

The architecture, the reasoning behind these choices, and the conventions
themes must follow are documented in the
[Kokku Master Theme README](https://github.com/Kokku/kokku-master-theme#build-tooling).

Tracked in Linear: [KOKKU-40](https://linear.app/kokku/issue/KOKKU-40) (child
theme release pipelines) and
[KOKKU-58](https://linear.app/kokku/issue/KOKKU-58) (lean production ZIPs).
