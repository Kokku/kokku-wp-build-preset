/**
 * Shared webpack preset for Kokku WordPress themes.
 *
 *     module.exports = require('@kokku/wp-build-preset')(__dirname);
 *
 * Conventions:
 *   src/js/main.js  the entry every theme has; it imports the theme's SCSS, so
 *                   webpack emits dist/main.js AND dist/main.css from it.
 *   dist/           the only output, and the only thing the parent theme
 *                   enqueues (kokku_child_asset_path() in the Master Theme).
 *
 * Differences from bare @wordpress/scripts, and the rest of the rationale, are
 * documented in the Master Theme README under "Build tooling".
 *
 * @param {string} themeDir Absolute path to the theme root -- pass __dirname.
 * @param {Object} [options]
 * @param {Object} [options.entry] Extra entries, merged over the default.
 * @param {boolean} [options.rtl=false] Emit *-rtl.css. Off by default: nothing
 *   in the Kokku stack enqueues it, and it roughly doubles shipped CSS.
 * @return {Object} A webpack configuration.
 */

const path = require('path');

module.exports = function kokkuWpBuildPreset(themeDir, options = {}) {
	if (!themeDir) {
		throw new Error(
			'@kokku/wp-build-preset: pass the theme directory, e.g. require(...)(__dirname)'
		);
	}

	const defaultConfig = require('@wordpress/scripts/config/webpack.config');
	const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

	const { entry = {}, rtl = false } = options;

	// wp-scripts ships only TerserPlugin in optimization.minimizer -- there is
	// no CSS minimizer at all, so imported vendor stylesheets ship with every
	// comment and newline intact unless one is added.
	const minimizer = [
		...(defaultConfig.optimization?.minimizer ?? []),
		new CssMinimizerPlugin(),
	];

	const plugins = rtl
		? defaultConfig.plugins
		: defaultConfig.plugins.filter(
				(plugin) => plugin.constructor.name !== 'RtlCssPlugin'
		  );

	return {
		...defaultConfig,
		plugins,
		optimization: {
			...defaultConfig.optimization,
			minimizer,
		},
		entry: {
			main: path.resolve(themeDir, 'src/js/main.js'),
			...entry,
		},
		output: {
			...defaultConfig.output,
			path: path.resolve(themeDir, 'dist'),
			filename: '[name].js',
		},
	};
};
