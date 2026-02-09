const { withEntitlementsPlist } = require('@expo/config-plugins');

/**
 * Removes the Push Notifications (aps-environment) entitlement from the iOS app.
 * Use this when building with a personal/free Apple Developer account, which
 * does not support Push Notifications. Without this, prebuild adds the
 * entitlement (e.g. via expo-notifications dependency) and the build fails.
 */
function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (config) => {
    if (config.modResults && typeof config.modResults === 'object') {
      delete config.modResults['aps-environment'];
    }
    return config;
  });
}

module.exports = withoutPushEntitlement;
