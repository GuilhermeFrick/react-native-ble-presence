const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  projectRoot,
  watchFolders: [workspaceRoot],
  resolver: {
    extraNodeModules: {
      react: path.resolve(workspaceRoot, 'node_modules/react'),
      'react-native': path.resolve(workspaceRoot, 'node_modules/react-native'),
    },
    nodeModulesPaths: [
      path.resolve(workspaceRoot, 'node_modules'),
      path.resolve(projectRoot, 'node_modules'),
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
