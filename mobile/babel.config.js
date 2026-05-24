module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Replace import.meta.env with process.env so packages like zustand work on web
      ({ types: t }) => ({
        visitor: {
          MemberExpression(path) {
            if (
              t.isMetaProperty(path.node.object) &&
              path.node.object.meta.name === 'import' &&
              path.node.object.property.name === 'meta' &&
              t.isIdentifier(path.node.property, { name: 'env' })
            ) {
              path.replaceWith(t.identifier('process.env'));
            }
          },
        },
      }),
      // Reanimated/worklets babel plugin disabled — the package is aliased to
      // a JS-only shim in metro.config.js to keep Expo Go on iOS working.
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@hooks': './src/hooks',
            '@stores': './src/stores',
            '@api': './src/api',
            '@theme': './src/theme',
            '@utils': './src/utils',
          },
        },
      ],
    ],
  };
};
