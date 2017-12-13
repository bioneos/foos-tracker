var express = require('express'),
  router = express.Router(),
  db = require('../../models');

/**
 * Games API
 *   For listing game stats, visualizations.
 */
module.exports = function (app) {
  app.use('/api/', router);
};

router.get('/games/last/:num', function (req, res, next) {
  getRecentGames({ num: parseInt(req.params['num']) }, res);
});
router.get('/games/last', function (req, res, next) {
  getRecentGames({ num: 1}, res);
});
router.get('/games/:start/:end', function (req, res, next) {
  getGames({
    start: parseInt(req.params['start']),
    stop: parseInt(req.params['stop'])
  }, res);
});
router.get('/games/:start', function (req, res, next) {
  getGames({ start: parseInt(req.params['start']) }, res);
});
router.get('/games', function (req, res, next) {
  getGames({}, res);
});

/** 
 * Async Helper to get all game data for a given range, and send back a JSON
 * object to the specified Response (res).
 */
function getGames({start = 0, stop = Date.now()} = {}, res)
{
  db.Game.findAll({ 
    where: { 
      when: { gt: start, lte: stop } 
    }, 
    order: [
      ['when', 'DESC']
    ],
    include: [db.Player, db.Goal]
  }).then(function(games) {
    
    // Error handling
    if (!games) 
    {
      res.statusCode = 404;
      return res.json({error: "No games found in that Date Range"});
    }

    // Build the game data
    var allDetails = { games: [] };
    games.forEach(function(game) {
      var details = {};
      details.id = game.id;
      details.when = game.when;
      details.threshold = game.threshold;
      details.winner = game.winner;
      // Keyed by Player.nick, array list of times scored
      details.goals = {};
      // Setup the pids with goal #0 first
      game.Players.forEach(function(player) {
        var nick = player.nick || player.name;
        if (player.id === details.winner) details.winner = nick;
        details.goals[nick] = 0;
      });
      // Push the goals
      game.Goals.forEach(function(goal) {
        // Get the player nickname
        game.Players.forEach(function (player) { 
          var nick = player.nick || player.name;
          if (player.id === goal.PlayerId) details.goals[nick]++; 
        });
      });
      allDetails['games'].push(details);
    });


    // All done
    res.json(allDetails);
  })
  .catch(function(err) {
    res.statusCode = 500;
    res.json({error: err});
  });
}

/** 
 * Async Helper to get the game data for a number of recent games, ordered by 
 * date with the most recent game first. Send back a JSON object to the
 * specified Response (res).
 */
function getRecentGames({num = 1} = {}, res)
{
  db.Game.findAll({ 
    limit: num,
    order: [
      ['when', 'DESC']
    ],
    include: [db.Player, db.Goal]
  }).then(function(games) {
    
    // Error handling
    if (!games) 
    {
      res.statusCode = 404;
      return res.json({error: "No games found in that Date Range"});
    }

    // Build the game data
    var allDetails = { games: [] };
    games.forEach(function(game) {
      var details = {};
      details.id = game.id;
      details.when = game.when;
      details.threshold = game.threshold;
      details.winner = game.winner;
      // Keyed by Player.nick, array list of times scored
      details.goals = {};
      // Setup the pids with goal #0 first
      game.Players.forEach(function(player) {
        var nick = player.nick || player.name;
        if (player.id === details.winner) details.winner = nick;
        details.goals[nick] = 0;
      });
      // Push the goals
      game.Goals.forEach(function(goal) {
        // Get the player nickname
        game.Players.forEach(function (player) { 
          var nick = player.nick || player.name;
          if (player.id === goal.PlayerId) details.goals[nick]++; 
        });
      });
      allDetails['games'].push(details);
    });


    // All done
    res.json(allDetails);
  })
  .catch(function(err) {
    res.statusCode = 500;
    res.json({error: err});
  });
}
