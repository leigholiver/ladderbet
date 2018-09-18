var irc = require("irc");
var settings = require("./config.js");
var botSettings = {
  server: "irc.twitch.tv",
  username: settings['botname'],
  password: settings['twitchoauth'],
};

var bot = new irc.Client(
  botSettings.server, 
  botSettings.username, 
  { 
    username: botSettings.username, 
    password: botSettings.password,
    channels: ['#' + settings['botname']],
  }
);

bot.addListener("connect", function () {
    console.log("Connected");
});

bot.addListener("message", function (from, to, text, message) {
  if(text.startsWith('!points')) {
    var pointMessages = game.getPointMessages();
    var scores = game.getScores();
    pointMessages.push({ "channel": to, "user": from, "score": (scores[from]? scores[from] : 0)});
  }

  var cmd = text.split(' ');

  // get config 
  var configs = require("./config-handler.js");

  var config = configs[to.substr(1)];
  if (config == undefined) {
    config = settings['defaultConfig'];
  }
  
var g =  game.getGames();
  var found = false;
  for(i=0;i<g[to.substr(1)]['players'].length; i++) {
    if(g[to.substr(1)]['players'][i]["isme"]) {
      found = true;
      if(config['my-name'] != "") {
        g[to.substr(1)]['players'][i]["name"] = config['my-name'];
      }
    }
  }

  if(!found || configs[to.substr(1)]['game-mode'] == 'caster') {
    for(var i = 0; i<g[to.substr(1)]['players'].length; i++) {
      if(cmd[0].substr(1).toLowerCase() == g[to.substr(1)]['players'][i]['name'].toLowerCase()) {
        console.log("recording bet for " + g[to.substr(1)]['players'][i]['name'].toLowerCase());
        game.recordBet(from, to.substr(1), g[to.substr(1)]['players'][i]['name'], cmd[1]);
        break;
      }
    }
  }
  else {
    var win = configs[to.substr(1)]['win-command'];
    var lose = configs[to.substr(1)]['lose-command'];

    if(text.startsWith(win)) {
      game.recordBet(from, to.substr(1), true, cmd[1]); // user, channel, first word, second word !win amount
    }
    if(text.startsWith(lose)) {
      game.recordBet(from, to.substr(1), false, cmd[1]); // user, channel, first word, second word !win amount
    }
  }

});

bot.addListener('error', function(message) {
    console.log('ERROR: %s: %s', message.command, message.args.join(' '));
});

module.exports = bot;
