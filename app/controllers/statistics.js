var express = require('express'),
  router = express.Router(),
  Sequelize = require('sequelize'),
  db = require('../models');

module.exports = function (app) {
  app.use('/stats', router);
};


/** Page Routes: **/
/**
 * Render the history page using our history template.
 */
router.get('/', function(req, res, next) {
  // TODO: leaderboard vs visualize in separate tabs
  res.render('statistics', {title: 'Statistics'});
});

/**
 * Get all goal data for a date range.
 */
router.get('/games/:start/:stop', function(req, res, next) {
  var start = new Date(parseInt(req.params.start));
  var stop = new Date(parseInt(req.params.stop));

  getAllGames(start, stop, function(err, games) {
    if (err) 
    {
      res.statucCode = 500;
      return res.json({'error' : 'Internal error: ' + err});
    }
    else if (games === null)
    {
      res.statusCode = 404;
      return res.json({'error' : 'No game data for that range...'});
    }

    return res.json(games);
  });
});

/**
 * Get ALL goal data.
 */
router.get('/games/', function(req, res, next) {
  var stop = new Date(parseInt(req.params.stop));

  getAllGames(new Date(0), new Date(), function(err, games) {
    if (err) 
    {
      res.statucCode = 500;
      return res.json({'error' : 'Internal error: ' + err});
    }
    else if (games === null)
    {
      res.statusCode = 404;
      return res.json({'error' : 'No game data for that range...'});
    }

    return res.json(games);
  });
});

/**
 * Private Async helper to get all game data for a date range.
 * @param callback(error, {games: []})
 *   Callback function to call on complete. 
 *   First parameter is an error object or null.
 *   Second param is an object of all game data as described above, 
 *     or null if no games fall into the date range.
 */
function getAllGames(start, stop, callback)
{
  //console.log('Finding data from ' + start + ' to ' + stop);
  db.Game.findAll({ 
    where: { 
      when: { $between: [start, stop] } 
    }, 
    order: [
      ['when', 'ASC']
    ],
    include: [db.Player, db.Goal]
  }).then(function(games) {
    
    // Error handling
    if (!games) return callback(null, null);

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
    callback(null, allDetails);
  }).catch(function(err) {
    callback(err, null);
  });
};
