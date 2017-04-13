var express = require('express'),
  router = express.Router(),
  util = require('../../../util'),
  db = require('../../models');

/**
 * Players API
 *   For viewing player data for all players.
 */
module.exports = function (app) {
  app.use('/api/', router);
};

/**
 * Get a sorted Array of player statistics over a date range (optional).
 * TODO: "GameDay" stats
 */
router.get('/players/stats/:start/:stop', function (req, res, next) {
  getPlayerStats({
    start: parseInt(req.params['start']),
    stop: parseInt(req.params['stop']),
    sortBy: req.query['sortBy'],
    sortOrder: req.query['sortOrder']
  }, res);
});
router.get('/players/stats/:start', function (req, res, next) {
  getPlayerStats({
    start: parseInt(req.params['start']),
    sortBy: req.query['sortBy'],
    sortOrder: req.query['sortOrder']
  }, res);
});
router.get('/players/stats', function (req, res, next) {
  getPlayerStats({
    sortBy: req.query['sortBy'],
    sortOrder: req.query['sortOrder']
  }, res);
});

/**
 * Get the Player list as a JSON object. 
 * TODO: add things like last played date, num games played, etc?
 */
router.get('/players', function (req, res, next) {
  db.Player.findAll().then(function (players) {
    res.json({ players: players });
  })
  .catch(function(error) {
    res.statusCode = 500;
    res.json({error: error});
  });
});

/**
 * Get all statistics for active players for the given date range. Given the
 * provided "response" object, send appropriate json to the caller.
 */
function getPlayerStats({start = 0, stop = Date.now(), sortBy = 'win%', sortOrder = 'ASC'} = {}, res)
{
  var stats = {} ;

  // 
  // Load all games in our range, 
  var time0 = Date.now();
  db.Game.findAll({ 
    'include' : [ db.Player, db.Goal ], 
    'where': {createdAt: { gt: start, lt: stop }}
  })
  .then(function (games) {
    //console.log('Sequelize.findAll: %dms', (Date.now() - time0));
    // Loop over the games, accumulating stats and players all at once
    var time1 = 0, time2 = 0;
    games.forEach(function(game) {
      var time = Date.now();
      var gpp = util.getGoalsPerPlayerSync(game);
      //console.log("Game %d: ", game.id, gpp);
      time1 += (Date.now() - time);

      time = Date.now();
      Object.keys(gpp).forEach(function(pid) {
        // Setup a player placeholder if needed
        if (!stats[pid])
        {
          // Have to loop the active Players array to find the other data :(
          var player = {};
          game.Players.forEach(function(obj) {
            if (obj.id == pid) 
            {
              player = obj;
              return;
            }
          });
          stats[pid] = {
            'id' : player.id,
            'name' : player.name,
            'nick' : player.nick,
            'retired' : player.retired || false,
            'goals' : 0,
            'wins' : 0,
            'losses' : 0,
            'embs' : 0
          };
        }
        // Win/Loss
        if (game.winner == pid) stats[pid].wins++;
        else if (game.winner !== null) stats[pid].losses++;
        // Embarassments
        if (game.winner !== null && gpp[pid] == 0) stats[pid].embs++;
        // Goals For
        stats[pid].goals += gpp[pid];
      });
      time2 += (Date.now() - time);
    });
    //console.log('getGoalsPerPlayerSync: %dms', time1);
    //console.log('Object.keys(gpp).forEach: %dms', time2);

    // Object is keyed by pid, now sort in order as specified, convert to array
    var sorted = [];
    Object.keys(stats).forEach(function(pid) { sorted.push(stats[pid]); });
    sorted.sort(function(a, b) {
      // This assumes "win%" is the only sortby that isn't present on the objects
      var left = a.wins * 1.0 / (a.wins + a.losses);
      var right = b.wins * 1.0 / (b.wins + b.losses);
      if (a[sortBy] && b[sortBy])
      {
        // This assumes a/b["sortBy"] value is numeric
        left = a[sortBy];
        right = b[sortBy];
      }

      return (sortOrder === 'DESC' ? -1 : 1) * (right - left);
    });

    // Respond to url requester
    res.json({ stats : sorted });
  })
  .catch(function(err) {
    // Something went wrong...
    res.statusCode = 500;
    res.json({ error: err });
  });
}
