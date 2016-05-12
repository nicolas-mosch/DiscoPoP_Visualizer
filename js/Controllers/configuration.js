var nconf = require('nconf').file({file: getUserHome() + '/config.json'});
nconf.defaults({
  cuColor: '#00FF00',
  functionColor: '#00FFFF',
  loopColor: '#FF6633',
  selectedNodeColor: '#FFFFFF',
  defaultColor: '#FFFF33'
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
