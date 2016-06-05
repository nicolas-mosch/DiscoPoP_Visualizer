var nconf = require('nconf').file({
  file: getUserHome() + '/config.json'
});

// The default values
nconf.defaults({
  cuColorFill: '#00FF00',
  cuColorLabel: '#000000',
  functionColorFill: '#00FFFF',
  functionColorLabel: '#000000',
  loopColorFill: '#FF6633',
  loopColorLabel: '#000000',
  selectedNodeColorFill: '#FFFF33',
  selectedNodeColorLabel: '#000000',
  libraryFunctionColorFill: '#FF0F33',
  libraryFunctionColorLabel: '#000000',
  defaultColorFill: '#FFFFFF',
  defaultColorLabel: '#000000',
  flowEdgeFill: '#00FF00',
  flowEdgeWidth: 3,
  dependencyEdgeFill: '#000000',
  dependencyEdgeWidth: 2,
  functionCallEdgeFill: '#000000',
  functionCallEdgeWidth: 1,
  visibleParents: 5
});

function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}
/**
 * Module for saving and reading configuration settings to the config file
 * @module configuration
 */
module.exports = {
  /**
   * Save the setting to the settings file
   * @param  {string} settingKey   The key of the setting
   * @param  {string} settingValue The value to be set for the setting
   */
  saveSetting: function saveSetting(settingKey, settingValue) {
    nconf.set(settingKey, settingValue);
    nconf.save();
  },

  /**
   * Read the saved value for the given setting key
   * @param  {string} settingKey The key for which to get its value
   * @return {string}            The value for the given setting-key
   */
  readSetting: function readSetting(settingKey) {
    nconf.load();
    return nconf.get(settingKey);
  }
};
