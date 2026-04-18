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
      'react-native-reanimated/plugin',
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
