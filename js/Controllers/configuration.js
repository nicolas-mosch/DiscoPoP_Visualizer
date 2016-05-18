var nconf = require('nconf').file({file: getUserHome() + '/config.json'});
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
  defaultColorLabel: '#000000'
});

function saveSetting(settingKey, settingValue) {
    nconf.set(settingKey, settingValue);
    nconf.save();
}

function readSetting(settingKey) {
    nconf.load();
    return nconf.get(settingKey);
}

function getUserHome() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

module.exports = {
    saveSetting: saveSetting,
    readSetting: readSetting
};
