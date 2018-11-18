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

  // get config 
  var configs = require("./config-handler.js");

  
  if(from == settings['adminUser']) {
      var cmd = text.split(' ');
      if(text.startsWith('!give')) {
        var scores = game.getScores();
        scores[cmd[1]] = (scores[cmd[1]]? scores[cmd[1]] : 0)*1 + cmd[2]*1;
      }
  }

  if(text.startsWith('!points')) {
    var pointMessages = game.getPointMessages();
    var scores = game.getScores();
    pointMessages.push({ "channel": to, "user": from, "score": (scores[from]? scores[from] : 0)});
  }

  if(text.startsWith('!leaderboard')) {
    var scores = game.getScores();
    var sortedScores = [];
    for(var key in scores) {
        sortedScores.push([key, scores[key]]); // each item is an array in format [key, value]
    }
    
    // sort items by value
    sortedScores.sort(function(a, b)
    {
      return b[1]-a[1]; // compare numbers
    });

    var leaders = "";
    var count = ( sortedScores.length > 5? 5 : sortedScores.length);

    var config = configs[to.substr(1)];
    if(config == undefined) {
      config = settings['defaultConfig'];
    }
    for(var i=0; i<count; i++) {
      leaders += sortedScores[i][0] + ": " + sortedScores[i][1] + " " + config['points-name'] +". ";
    }

    if(leaders != '') {
      var leaderboardMessages = game.getLeaderboardMessages();
      leaderboardMessages.push({ "channel": to, "message": leaders});
    }
  }

  var cmd = text.split(' ');
  var config = configs[to.substr(1)];
  if (config == undefined) {
    config = settings['defaultConfig'];
  }
  
var g =  game.getGames();
  if(g[to.substr(1)]) {
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
  }

});

bot.addListener('error', function(message) {
    console.log('ERROR: %s: %s', message.command, message.args.join(' '));
});

module.exports = bot;
