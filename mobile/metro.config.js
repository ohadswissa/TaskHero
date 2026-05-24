const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the whole monorepo so Metro sees shared packages
config.watchFolders = [workspaceRoot];

// Resolution order: mobile first, then workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Ensure native/expo packages (including reanimated 4.x which uses import.meta)
// are Babel-transformed instead of passed through raw.
config.transformer = {
  ...config.transformer,
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-reanimated|zustand)',
  ],
};

// Path to the local Reanimated shim. We alias `react-native-reanimated` to this
// shim because Reanimated 4's native worklets module crashes Expo Go on iOS
// (SDK 54) at module-eval time. The shim provides API-compatible stubs backed
// by React Native's built-in Animated module so the app boots inside Expo Go.
const REANIMATED_SHIM = path.resolve(projectRoot, 'src/shims/reanimated.ts');

// Intercept React resolution BEFORE Metro's normal node_modules traversal.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirect react-native-reanimated (and its deep imports) to our shim.
  if (
    moduleName === 'react-native-reanimated' ||
    moduleName.startsWith('react-native-reanimated/')
  ) {
    return { type: 'sourceFile', filePath: REANIMATED_SHIM };
  }
  if (
    moduleName === 'react' ||
    moduleName === 'react-dom' ||
    moduleName === 'react-native' ||
    moduleName.startsWith('react/') ||
    moduleName.startsWith('react-dom/')
  ) {
    return context.resolveRequest(
      { ...context, originModulePath: path.join(projectRoot, '_entry.js') },
      moduleName,
      platform,
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

