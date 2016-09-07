var express = require('express'),
  router = express.Router(),
  Sequelize = require('sequelize'),
  db = require('../models');

module.exports = function (app) {
  app.use('/history', router);
};


/** Page Routes: **/
/**
 * Render the history page using our history template.
 */
router.get('/', function(req, res, next) {

  res.render('history', {});
});


/** JSON routes: **/
/**
 * Get all goal data for a single game.
 */
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
      allDetails['games'].push(details);
    });


    // All done
    callback(null, allDetails);
  }).catch(function(err) {
    callback(err, null);
  });
};
