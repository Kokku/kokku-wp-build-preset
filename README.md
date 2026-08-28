# @kokku/wp-build-preset

Shared build tooling for Kokku WordPress themes: one webpack preset and one
reusable GitHub Actions release workflow, so fixing either is a single pull
request rather than the same edit repeated across twenty client repos.

Both exist because of the same lesson. The Master Theme's release workflow had
grown to 25 `--exclude` flags, each added after something shipped that
shouldn't have — `vendor/`, 18 unused fonts, a compiled intermediate. Copying
that workflow into every child theme would have copied the drift too.

## The webpack preset

A theme's entire `webpack.config.js`:

```js
module.exports = require('@kokku/wp-build-preset')(__dirname);
```

That gives one entry, `src/js/main.js`, which imports the theme's SCSS — so the
build emits `dist/main.js` and `dist/main.css`. Those are exactly the two files
the Master Theme looks for when deciding how to enqueue a child theme's assets
(`kokku_child_asset_path()` in its `lib/assets.php`).

Extra entries are opt-in. The Master Theme uses that for its block bundle and
its admin script:

```js
const path = require('path');

module.exports = require('@kokku/wp-build-preset')(__dirname, {
	entry: {
		blocks: path.resolve(__dirname, 'src/js/blocks/blocks.js'),
		'admin-sort': path.resolve(__dirname, 'src/js/admin/admin-sort.js'),
	},
});
```

### What it changes versus bare `@wordpress/scripts`

- **Adds a CSS minimizer.** `@wordpress/scripts` ships only `TerserPlugin` in
  `optimization.minimizer` — there is no CSS minimizer at all, so imported
  vendor stylesheets ship with every comment and newline intact.
- **Drops `RtlCssPlugin`.** It emits a `*-rtl.css` beside every bundle, roughly
  doubling shipped CSS. Nothing in the Kokku stack enqueues it. Pass
  `{ rtl: true }` if a client ever needs it.
- **Outputs to `dist/`, not `build/`**, matching what the Master Theme enqueues.

### Installing

```
npm install --save-dev github:Kokku/kokku-wp-build-preset#v1
```

`@wordpress/scripts` and `css-minimizer-webpack-plugin` are peer dependencies,
so each theme pins its own versions.

## The reusable release workflow

A theme's whole release workflow:

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
      slug: mrec-theme
      has-build: false
```

### Inputs

| Input | Default | Notes |
|---|---|---|
| `slug` | *required* | Theme folder name. Must match the directory and the release asset name the updater looks for. |
| `has-build` | `false` | Runs `npm ci` and `npm run build`. A theme with no build step still gets a release ZIP. |
| `has-composer` | `false` | Runs `composer install --no-dev` and ships `vendor/`. Only for real runtime PHP dependencies — the Master Theme has none. |
| `php-version` | `8.3` | Used only when `has-composer` is true. |
| `build-outputs` | `dist/main.css`, `dist/main.js` | Files that must exist after the build, or the release fails. |
| `extra-paths` | — | Extra paths to include in the ZIP beyond the defaults. |

### What ships

An **allowlist**, not an exclude list — so anything new in a repo is opt-in
rather than shipped by default:

```
acf-json  dist  lib  parts  patterns  styles  templates  update
functions.php  index.php  style.css  theme.json  screenshot.png
```

A path that doesn't exist in a given theme is skipped rather than failing, so
one list serves themes with and without a build, ACF JSON, or style variations.
`.DS_Store` is excluded everywhere, and the job fails loudly if the assembled
theme has no `style.css` — a theme without its header is not a theme.

### Why every theme gets a release, even without a build

The updater prefers a named release asset and falls back to GitHub's source
zipball. That fallback is the raw, unbuilt tree, and it caused two of the bugs
in KOKKU-59 and KOKKU-61. Giving even a no-build child theme a real
`<slug>.zip` asset removes the fallback path entirely.

## Versioning

Both consumers pin `@v1`. Move the `v1` tag forward for backwards-compatible
changes; cut `v2` for anything that would break a calling theme.
