var fs = require("fs"),
  jf = require("jsonfile");
  
var configFile = 'data/configs.json';
var configs = {};
try {
  configs = jf.readFileSync(configFile);
}
catch(e) {
  jf.writeFileSync(configFile, configs);
}

module.exports = configs;