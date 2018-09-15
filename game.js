var twitch = require("./twitch.js"),
  configs = require("./config-handler.js"),
  fs = require("fs"),
  jf = require("jsonfile"),
  settings = require("./config.js");

var scoreFile = 'data/scores.json';
var scores = {};
try {
  scores = jf.readFileSync(scoreFile);
}
catch(e) {
  jf.writeFileSync(scoreFile, scores);
}

var games = [];
var timers = [];
var clearTimers = [];
var pointMessages = [];
var joinedChannels = [];

module.exports = {
  getPointMessages: function() {
    return pointMessages;
  },
  getScores: function() {
    return scores;
  },
  getGames: function() {
    return games;
  },
  calculateVoteAmounts: function(channel, game) {
    if(game == undefined) {
      return { 'win': 0, 'lose': 0 };
    }
    var config = configs[channel];    
    if(config == undefined) {
      config = settings['defaultConfig'];
    }
    var bets = game.bets;
      var win = 0;
      var loss = 0;
      if(config['game-mode'] == 'caster') {
          var scores = [];
          for(var i=0;i<bets.length;i++) {
            if(scores[bets[i]['win']] == undefined) {
              scores[bets[i].win] = 1;
            }
            else {
              scores[bets[i].win] = scores[bets[i].win] + 1;
            }
          }
          if(scores[game['players'][0]['name']] != undefined) {
              win = scores[game['players'][0]['name']];
          }
          if(scores[game['players'][1]['name']] != undefined) {
              loss = scores[game['players'][1]['name']];
          }
      }
      else {
        for(var i=0;i<bets.length;i++) {
          if(bets[i]['win'] == true) {
            win++;
          }
          else {
            loss++;
          }
        }
        
      }
      return { 'win': win, 'lose': loss };
  },
  calculateBetAmounts: function(channel, game) {
    if(game == undefined) {
      return { 'win': 0, 'lose': 0 };
    }
    var config = configs[channel];
    var bets = game.bets;
      var win = 0;
      var loss = 0;
      if(config['game-mode'] == 'caster') {
          var scores = [];
          for(var i=0;i<bets.length;i++) {
            if(scores[bets[i]['win']] == undefined) {
              scores[bets[i].win] = bets[i]['amount'];
            }
            else {
              scores[bets[i].win] = scores[bets[i].win] + bets[i]['amount'];
            }
          }
          if(scores[game['players'][0]['name']] != undefined) {
              win = scores[game['players'][0]['name']];
          }
          if(scores[game['players'][1]['name']] != undefined) {
              loss = scores[game['players'][1]['name']];
          }
      }
      else {
        for(var i=0;i<bets.length;i++) {
          if(bets[i].win == true) {
            win = win + bets[i]['amount'];
          }
          else {
            loss = loss + bets[i]['amount'];
          }
        }
        
      }
      return { 'win': win, 'lose': loss };
  },

  gameStart: function(channel, data) {
    clearTimeout(clearTimers[channel]);
    var config = configs[channel];
    if(config == undefined) {
      config = settings['defaultConfig'];
    }

    if(config['game-mode'] == 'caster') {
      if(config['playera-name']!= "") {
        data.players[0]["name"] = config['playera-name'];
      }
      if(config['playerb-name'] != "") {
        data.players[1]["name"] = config['playerb-name'];
      }
    }
    else {
      for(i=0;i<data.players.length; i++) {
        if(data.players[i]["isme"]) {
          found = true;
          if(config['my-name'] != "") {
            data.players[i]["name"] = config['my-name'];
          }
        }
      }
      if(!found) {
        return;
      }
    }  


    games[channel] = {
        state: 'open',
        bets: [],
        delay: config['delay'],
        players: data.players,
        winner: "",
        winnerRace: "",
      };
      
      if(joinedChannels[channel] != true) {
        joinedChannels[channel] = true;
        twitch.join("#"+channel);
      }
      
      setTimeout(function() { 
        twitch.say('#'+channel, module.exports.addVariablesToText(config['betting-open-text'], channel, games[channel]));
      }, games[channel].delay * 1000);
      
      
      clearTimeout(timers[channel]);
      timers[channel] = setTimeout(function() { 
        if(games[channel].state == 'open') {
          setTimeout(function() { 
            games[channel].state = 'closed';
            twitch.say('#'+channel, module.exports.addVariablesToText(configs[channel]['betting-closed-text'], channel, games[channel]));
          }, games[channel].delay * 1000);
        }
      }, config['open-for'] * 1000);

  },
  gameEnd: function(channel, data) {
    games[channel].state = 'ended';
    var config = configs[channel];
    if(config == undefined) {
      config = settings['defaultConfig'];
    }

    if(config['game-mode'] == 'caster') {
      if(config['playera-name']!= "") {
        data.players[0]["name"] = config['playera-name'];
      }
      if(config['playerb-name'] != "") {
        data.players[1]["name"] = config['playerb-name'];
      }
    }
    else {
      var found = false;
      for(i=0;i<data.players.length; i++) {
        if(data.players[i]["isme"]) {
          found = true;
          if(config['my-name'] != "") {
            data.players[i]["name"] = config['my-name'];
          }
        }
      }
      if(!found) {
        return;
      }
    }  

    var found = false;
    var won = false;
    var wonName = "";
    var wonRace = "";
    var i = 0;
    while(i<data.players.length) {
      if(data.players[i]['isme']) {
        found = true;
        if(data.players[i]['result'] == 'Victory') {
          won = true;
        }

      }
      if(data.players[i]['result'] == 'Victory') {
        wonName = data.players[i]['name'];
        wonRace = data.players[i]['race'];
      }
      i++;
    }

    games[channel].winner = wonName;
    games[channel].winnerRace = wonRace;



    // if betting mode is caster mode
    if(config['game-mode'] == 'caster') {
      won = wonName;
      setTimeout(function() { 
        twitch.say('#'+channel, module.exports.addVariablesToText(config['player-win-chat-text'], channel, games[channel]));
      }, games[channel].delay * 1000);
    }
    else {
      // say the win or loss text 
      if(found && won) {
        games[channel].state='win';
        setTimeout(function() { 
          twitch.say('#'+channel, module.exports.addVariablesToText(config['win-chat-text'], channel, games[channel]));
        }, games[channel].delay * 1000);
      }
      else if(found && !won) {
        games[channel].state='lose';
        setTimeout(function() { 
          twitch.say('#'+channel, module.exports.addVariablesToText(config['lose-chat-text'], channel, games[channel]));
        }, games[channel].delay * 1000);
      }
    }

    var bets = games[channel].bets;
    var total = 0;
    var winnerTotal = 0;
    var winners = [];
    for(var i=0;i<bets.length;i++) {
      total += bets[i].amount;
      if(bets[i].win == won) {
        winnerTotal+=bets[i].amount;
        winners.push(bets[i]);
      }
    }

    var msg = config['betting-ended-text'] + " Winners: ";
    for(var i=0;i<winners.length;i++) {
      var multiplier = winners[i].amount/winnerTotal;
      var winnings = (total*multiplier).toFixed(0);
      msg += winners[i].user+": "+winnings+" $points! "
      scores[winners[i].user] = (scores[winners[i].user]? scores[winners[i].user] : 0) + winnings;
    }
    if(msg != config['betting-ended-text'] + " Winners: ") {
      setTimeout(function() { 
        twitch.say('#'+channel, module.exports.addVariablesToText(msg, channel, games[channel]));
      }, games[channel].delay * 1000);
      jf.writeFileSync(scoreFile, scores);
    }
    // leave the channel
    if(joinedChannels[channel] == true) {
      joinedChannels[channel] = false;
      twitch.part("#"+channel);
    }
    

    if(config['ended-show-time'] != 0 && config['ended-show-time'] != "0") {
      clearTimers[channel] = setTimeout(function() {
         games[channel].state='hidden';
      }, (games[channel].delay + config['ended-show-time']) * 1000);
    }

  },

  recordBet: function(user, channel, win, amount) {
    var game = games[channel];
    var config = configs[channel];
    if(config == undefined) {
      config = settings['defaultConfig'];
    }
    if(game && game.state == 'open') {
     if(!(config['allow-multiple'] == true || config['allow-multiple'] == "true") || !game.bets.find(function(bet) { return bet.user == user; })) {
        if(!amount || !scores[user] || scores[user] == 0) {
          amount = 0;
        }
        else if(scores[user] >= amount) {
          // user has enough points
          scores[user] = scores[user] - amount;
        }
        else {
          // user does not have enough points
          amount = scores[user];
          scores[user] = 0;
        }
        amount = (amount*1 + 25); // brucey bonus

        var bet = {
            user: user, 
            win: win, 
            amount: amount,
        };
        game.bets.push(bet);
        return;
      }
    }
  },
  broadcastPoints: function() {
    var messages = [];
    while(msg = pointMessages.pop()) {
      if(messages[msg.channel]) {
        messages[msg.channel] += msg.user + ": " + msg.score+". ";
      }
      else {
        messages[msg.channel] = msg.user + ": " + msg.score+". ";
      }
    }
    Object.keys(messages).forEach(function (key) {
      twitch.say(key, messages[key])
    });
  },
  addVariablesToText: function(text, channel, game) {
      var config = configs[channel];
      if(config == undefined) {
        config = settings['defaultConfig'];
      }

      var scores = [];
      if(config['display-type'] == 'votes') {
        scores = module.exports.calculateVoteAmounts(channel, game);
      }
      else {
        scores = module.exports.calculateBetAmounts(channel, game);
      }

      var playerAVote = config['win-command'];
      var playerBVote = config['lose-command'];
      if(config['game-mode'] == 'caster') {
        playerAVote = "!" + game['players'][0]['name'];
        playerBVote = "!" + game['players'][1]['name'];
      }

      return text
        .replace(/\$playerAName/g, game['players'][0]['name'])
        .replace(/\$playerBName/g, game['players'][1]['name'])
        .replace(/\$playerARace/g, game['players'][0]['race'])
        .replace(/\$playerBRace/g, game['players'][1]['race'])
        .replace(/\$playerAScore/g, scores['win'])
        .replace(/\$playerBScore/g, scores['lose'])
        .replace(/\$winnerName/g, game['winner'])
        .replace(/\$winnerRace/g, game['winnerRace'])
        .replace(/\$points/g, config['points-name'])
        .replace(/\$playerAVote/g, playerAVote)
        .replace(/\$playerBVote/g, playerBVote)
      ;
  }
};

setInterval(module.exports.broadcastPoints, 6 * 1000);

 