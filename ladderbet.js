var http = require('http'),
  url = require('url'),
  fs = require("fs"),
  jf = require("jsonfile"),
  request = require('request'),
  settings = require("./config.js")
  configs = require("./config-handler.js"),
  game = require("./game.js");
  var path = require('path');

var port = process.env.PORT || 8080;
http.createServer(async function (req, res) {
  var urlpath = req.url;
  urlpath = urlpath.replace(settings['base-url'], '');
  var q = url.parse(req.url, true).query;
  
 var allowedFiles = [
    '/terran.png',
    '/protoss.png',
    '/zerg.png',
    '/random.png',
    '/wcs.css',
  ];

  if(allowedFiles.find(function(el) { return urlpath == el; }) != undefined) {
      var img = fs.readFileSync('.' + urlpath);
      res.writeHead(200);
      res.end(img, 'binary');
  }
  else if(urlpath.startsWith('/download-config')) {
      try {
        var channel = await twitchUsernameFromApiKey(q.apikey);
        if(channel == settings.adminUser) {
          var out = { scores: game.getScores(), configs: configs };
          res.writeHead(200);
          res.write(JSON.stringify(out));
        }
        else {
          res.end();
        }
      }
      catch(e) {
        console.log(e);
        console.log(data);
        res.end();
      }
  }      
  else if(urlpath.startsWith('/result')) {
      try {
        var channel = await twitchUsernameFromApiKey(q.apikey);
        var data = JSON.parse(q.json);
        switch(data.event) {
          case "enter": game.gameStart(channel, data); break;
          case "exit": game.gameEnd(channel, data); break;
        }
      }
      catch(e) {
        console.log(e);
        console.log(data);
        res.end();
      }
  }
  else if(urlpath.startsWith('/config')) {
      try {
        var channel = await twitchUsernameFromApiKey(q.apikey).catch(function(e) {console.log(e)});
        // if we're updating the configuration
        if(q['form-win-text'] != undefined) {
            var config = {
              'win-text': q['form-win-text'],
              'loss-text': q['form-loss-text'],
              'open-image': q['form-betting-open-image'],
              'closed-image': q['form-betting-closed-image'],
              'ended-image': q['form-betting-ended-image'],
              'image-location': q['form-image-location'],
              'points-name': q['form-points-name'],
              'betting-open-text': q['form-betting-open-text'],
              'betting-closed-text': q['form-betting-closed-text'],
              'betting-ended-text': q['form-betting-ended-text'],
              'delay': q['form-delay'],
              'open-for': q['form-open-for'],
              'custom-css': q['form-custom-css'],
              'display-type': q['form-display-type'],
              'win-image': q['form-betting-win-image'],
              'lose-image': q['form-betting-lose-image'],
              'ended-show-time': q['form-ended-show-time'],
              'win-command': q['form-win-command'],
              'lose-command': q['form-lose-command'],
              'allow-multiple': q['form-allow-multiple'],
              'show-names': q['form-show-names'],
              'show-races': q['form-show-races'],
              'show-points': q['form-show-points'],
              'name-position': q['form-name-position'],
              'game-mode': q['form-game-mode'],
              'win-chat-text': q['form-win-chat-text'],
              'lose-chat-text': q['form-lose-chat-text'],
              'player-win-chat-text': q['form-player-win-chat-text'],
              'player-win-text': q['form-player-win-text'],
              'winner-text-position': q['form-winner-text-position'],
              'my-name': q['form-my-name'],
              'playera-name': q['form-playera-name'],
              'playerb-name': q['form-playerb-name'],
              'wcs-theme': q['wcs-theme'],
            }
            configs[channel] = config;
            jf.writeFileSync('data/configs.json', configs);
        }
        else {
          // send the default config
          var out = settings['defaultConfig'];
          // unless there is already a config
          if(configs[channel] != undefined) {
              out = configs[channel];
          }
          var games = game.getGames();
          if(games[channel]) {
            out['state'] = games[channel].state;
            out['players'] = games[channel].players;
            out['winner'] = games[channel].winner;
            out['winnerRace'] = games[channel].winnerRace;
          }

          if(out['display-type'] == 'votes') {
            var amounts = game.calculateVoteAmounts(channel, games[channel]);
            out['win'] = (amounts['win'] / (amounts['win'] + amounts['lose'])) * 100;
            out['scores'] = amounts;
          }
          else {
            var amounts = game.calculateBetAmounts(channel, games[channel]);
            out['win'] = (amounts['win'] / (amounts['win'] + amounts['lose'])) * 100;
            out['scores'] = amounts;
          }
          res.writeHead(200);
          res.write(JSON.stringify(out));
        }
      }
      catch(e) {
        console.log(e);
        res.end();
      }
  }
  else {
      html = fs.readFileSync('./config.html', "utf8");
      html = html.replace("$TWITCHKEY", settings['twitchkey']);
      res.writeHead(200);
      res.write(html);
  }
  res.end();
}).listen(port);

function twitchUsernameFromApiKey(key) {
    return new Promise((resolve, reject) => {
        var options = {
          url: 'https://api.twitch.tv/kraken/user',
          method: 'GET',
          headers: {
            "Client-ID": settings['twitchkey'],
            "Authorization": "OAuth " + key
          },
        }
        request(options, (error, response, body) => {
            if (error) reject(error);
            if (!response || response.statusCode != 200) {
                //reject('Invalid status code <' + response.statusCode + '>');
                reject();
            }
            try {
              body = JSON.parse(body);
              if(body.display_name) {
                resolve(body.display_name.toLowerCase());
              }
            }
            catch(e) {
              reject(e);
            }
        });
    });
}