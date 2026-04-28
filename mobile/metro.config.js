const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the shared/ folder so the build script can read shared/palette.ts.
config.watchFolders = [...(config.watchFolders ?? []), path.resolve(workspaceRoot, 'shared')];

// In a pnpm workspace, hoisted deps may live above mobile/node_modules.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
