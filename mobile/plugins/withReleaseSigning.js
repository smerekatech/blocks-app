const { withAppBuildGradle } = require('@expo/config-plugins');

const SIGNING_BLOCK = `
    def keystorePropsFile = rootProject.file("../keystore.properties")
    def keystoreProps = new Properties()
    if (keystorePropsFile.exists()) {
        keystoreProps.load(new FileInputStream(keystorePropsFile))
    }

    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (keystoreProps['storeFile']) {
                storeFile rootProject.file("../" + keystoreProps['storeFile'])
                storePassword keystoreProps['storePassword']
                keyAlias keystoreProps['keyAlias']
                keyPassword keystoreProps['keyPassword']
            }
        }
    }`;

const RELEASE_SIGNING_LINE =
  "signingConfig keystoreProps['storeFile'] ? signingConfigs.release : signingConfigs.debug";

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') return cfg;
    let contents = cfg.modResults.contents;

    if (contents.includes('keystoreProps')) {
      return cfg;
    }

    contents = contents.replace(
      /\n\s*signingConfigs\s*\{\s*\n\s*debug\s*\{[\s\S]*?\n\s*\}\s*\n\s*\}/m,
      SIGNING_BLOCK,
    );

    contents = contents.replace(
      /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig\s+signingConfigs\.debug/,
      `$1${RELEASE_SIGNING_LINE}`,
    );

    cfg.modResults.contents = contents;
    return cfg;
  });
};
