var express = require('express'),
  router = express.Router(),
  Sequelize = require('sequelize'),
  db = require('../models');

/**
 * Expose our configuration function (module-pattern)
 */
module.exports = function (app) {
  app.use('/history', router);
};


/** Internal definitions (Routes) **/
/**
 * Page templates:
 */
router.get('/', function(req, res, next) {
  res.render('history', {});
});

/**
 * JSON routes:
 */
// Get all goal data for a single game
router.get('/game/:id/', function(req, res, next) {
  db.Game.findById(req.params.id, { include: [db.Player, db.Goal]}).then(function(game) {
    
    // Error handling
    if (!game) 
    {
      res.statusCode = 404;
      res.json({'error' : 'No game exists with that id'});
      return;
    }

    // Build the game data
    var details = {};
    details.id = game.id;
    details.when = game.when;
    details.threshold = game.threshold;
    // Keyed by Player.nick, array list of times scored
    details.goals = {};
    // Setup the pids with goal #0 first
    game.Players.forEach(function(player) {
      details.goals[player.nick] = [{num:0, when: game.when}];
    });
    // Push the goals
    game.Goals.forEach(function(goal) {
      // Get the player nickname
      var nick = "";
      game.Players.forEach(function (player) { 
        if (player.id === goal.PlayerId) nick = player.nick; 
      });
      var count = details.goals[nick].length;
      details.goals[nick].push({num: count, when: goal.when});
    });


    // Respond
    res.json(details);
  });
}) ;

