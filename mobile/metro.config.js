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

// Intercept React resolution BEFORE Metro's normal node_modules traversal.
// This prevents nested copies (e.g. expo-router/node_modules/react) from
// winning over the canonical single copy in mobile/node_modules/react.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === 'react' ||
    moduleName === 'react-dom' ||
    moduleName === 'react-native' ||
    moduleName.startsWith('react/') ||
    moduleName.startsWith('react-dom/')
  ) {
    // Pretend the require came from the project root so Metro walks
    // mobile/node_modules first and finds the canonical copy.
    return context.resolveRequest(
      { ...context, originModulePath: path.join(projectRoot, '_entry.js') },
      moduleName,
      platform,
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

