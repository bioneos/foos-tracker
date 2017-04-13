var express = require('express'),
  router = express.Router(),
  db = require('../../models');

/**
 * Goals API
 *   For getting a goals timeline for a single game.
 */
module.exports = function (app) {
  app.use('/api/', router);
};

router.get('/goals/:game_id', function (req, res, next) {
  db.Game.findById(req.params['game_id'], { include: [db.Player, db.Goal]})
  .then(function(game) {
    // Error handling
    if (!game) 
    {
      res.statusCode = 404;
      return res.json({'error' : 'No game exists with that id'});
    }

    // Build the game data
    var details = {};
    details.id = game.id;
    details.when = game.when;
    details.threshold = game.threshold;
    // Keyed by Player.nick, array list of times scored
    details.goals = {};
    details.winner = game.winner;
    // Setup the pids with goal #0 first
    game.Players.forEach(function(player) {
      var nick = player.nick || player.name;
      if (player.id === details.winner) details.winner = nick;
      details.goals[nick] = [{num:0, when: game.when}];
    });
    // Push the goals
    game.Goals.forEach(function(goal) {
      // Get the player nickname
      var nick = "";
      game.Players.forEach(function (player) { 
        if (player.id === goal.PlayerId) nick = player.nick || player.name; 
      });
      var count = details.goals[nick].length;
      details.goals[nick].push({num: count, when: goal.when});
    });


    // Respond
    res.json(details);
  })
  .catch(function(err) {
  });
});
