var express = require('express'),
  router = express.Router(),
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
 *
 * NOTE: By adding in GameDay grouping on the same stats, we cannot sort 
 *   on both types of groupings. Therefore the GameDay stats might be out of
 *   order relative to the requested sort. Because of this, it might make
 *   sense to create a second API call for GameDay stats and split the two.
 */
function getPlayerStats({start = 0, stop = Date.now(), sortBy = 'win%', sortOrder = 'ASC'} = {}, res)
{
  var stats = {} ;

  // 
  // Load all games in our range, 
  var time0 = Date.now();
  db.Game.findAll({ 
    'include' : [ db.Player, db.Goal ], 
    'where': {
      createdAt: { gte: start, lt: stop },
      winner: { ne: null }
    }
  })
  .then(function (games) {
    //console.log('Sequelize.findAll: %dms', (Date.now() - time0));
    // Loop over the games, accumulating stats and players all at once
    // NOTE: we build our gameDay grouping during this loop, but process
    //   the results in the second loop
    var time1 = 0, time2 = 0;
    var gamedays = {};
    games.forEach(function(game) {
      var time = Date.now();
      var gpp = getGoalsPerPlayer(game);
      //console.log("Game %d: ", game.id, gpp);
      time1 += (Date.now() - time);

      time = Date.now();
      Object.keys(gpp).forEach(function(pid) {
        // Setup a player placeholder if needed
        stats[pid] = stats[pid] || createEmptyStats(game, pid);

        // Standard stat grouping
        if (game.winner == pid) stats[pid].wins++;
        else if (game.winner !== null) stats[pid].losses++;
        if (game.winner !== null && gpp[pid] == 0) stats[pid].embs++;
        stats[pid].goals += gpp[pid];

        // Compile GameDay groupings
        var gameday = new Date(game.when);
        gameday = new Date(gameday.getFullYear(), gameday.getMonth(), gameday.getDate());
        gamedays[gameday.getTime()] = gamedays[gameday.getTime()] || { highest: 0 };
        gamedays[gameday.getTime()][pid] = gamedays[gameday.getTime()][pid] || 0;
        gamedays[gameday.getTime()][pid] += gpp[pid];
        if (gamedays[gameday.getTime()][pid] > gamedays[gameday.getTime()].highest)
          gamedays[gameday.getTime()].highest = gamedays[gameday.getTime()][pid];
      });
      time2 += (Date.now() - time);
    });
    //console.log('getGoalsPerPlayerSync: %dms', time1);
    //console.log('Object.keys(gpp).forEach: %dms', time2);
    
    // Now compile GameDay stats
    // NOTE: All this looping must be SLOW?! Improvements requested!
    for (time in gamedays)
    {
      var gameday = gamedays[time];

      // Check for ties (count winners)
      var winner = 0;
      for (pid in gameday)
      {
        if (pid === 'highest') continue;
        
        if (gameday[pid] == gameday.highest)
          winner++;
      }
      
      // Now compile states (with ties when winner count > 1)
      for (pid in gameday)
      {
        if (pid === 'highest') continue;

        if (gameday[pid] == gameday.highest && winner == 1)
          stats[pid].gameDayWins++;
        else if (gameday[pid] == gameday.highest && winner > 1)
          stats[pid].gameDayTies++;
        else if (gameday[pid] < gameday.highest)
          stats[pid].gameDayLosses++;
        if (gameday[pid] == 0)
          stats[pid].gameDayEmbs++;
      }
    }

    // Sort
    //   Stats Object is keyed by pid, now sort in order as specified,
    //   convert to array
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
    res.json({ error: err.message });
  });
}

/**
 * Helper method to create an empty stats object given a PlayerID.
 */
function createEmptyStats(game, pid)
{
  // Find the Player Instance from the Game Instance (by pid)
  var player = {};
  game.Players.forEach(function(obj) {
    if (obj.id == pid) player = obj;
  });
  return {
    'id' : player.id,
    'name' : player.name,
    'nick' : player.nick,
    'retired' : player.retired || false,
    'goals' : 0,
    'wins' : 0,
    'losses' : 0,
    'embs' : 0,
    'gameDayWins' : 0,
    'gameDayLosses' : 0,
    'gameDayTies' : 0,
    'gameDayEmbs' : 0
  };
}

/**
 * Helper method to get the number of goals scored per player as an object.
 * NOTE: This class will throw an exception unless the supplied 'Game' Instance
 *   'included' both the 'Goal' and 'Player' Models when it was created.
 * @param game
 *   Assumed to be a Sequelize Instance of the 'Game' model. See note above.
 * @return 
 *   An object with the following stucture:
 *   {
 *     <PlayerId>: <numGoals>,
 *     ...
 *   }
 */
function getGoalsPerPlayer(game)
{
  if (game.Players === undefined || game.Goals === undefined)
    throw new Error('Game instance did not "include" both the Goal and Player Models');
  
  // Now build our Object
  var ret = {};
  game.Players.forEach(function(player) {
    ret[player.id] = 0;
  });
  game.Goals.forEach(function(goal) { 
    ret[goal.PlayerId]++;
  });

  // Return our Object
  return ret;
}
