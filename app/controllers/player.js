var express = require('express'),
  router = express.Router(),
  util = require('../../util'),
  db = require('../models');

module.exports = function (app) {
  app.use('/players', router);
};

// Page templates:
/**
 * Create a Player
 */
router.get('/create', function(req, res, next) {
  // Just serve up our create UI
  res.render('player') ;
}) ;

/**
 * Edit a Player
 */
router.get('/:id/edit', function(req, res, next) {
  if (isNaN(req.params.id)) res.status(400).end() ;

  // This is an edit, so attempt to find our player
  db.Player.find({ where : { id: req.params.id }}).then(function(player) {
    if (player) res.render('player', { player: player }) ;
    else res.render('player', { idNotFound: true }) ;
  }) ;
}) ;

/**
 * Stats for a Player
 */
router.get('/:id/stats', function(req, res, next) {
  // TODO
}) ;

// JSON routes:
/**
 * Get all Players
 */
router.get('/all', function (req, res, next) {
  db.Player.findAll().then(function (players) {
    var ret = { players: [] };
    var details = {};
    players.forEach(function(player) {
      details = {
        id: player.id,
        name: player.name,
        email: player.email,
        nick: player.nick,
        retired: player.retired || 0,
        gender: player.gender
      };
      ret.players.push(details);
    });
    res.json(ret);
  });
});

/**
 * Get the all-time record data for every player in the database.
 */
router.get('/leaderboard', function(req, res, next) {
  var leaderboard = {} ;

  // Load up our players for our game summary table
  db.Player.findAll().then(function (players) {
    // 
    // Create the leaderboard positions
    players.forEach(function(player) {
      var playerObj = {
        'id' : player.id,
        'name' : player.name,
        'nick' : player.nick,
        'retired' : player.retired || false,
        'wins' : 0,
        'losses' : 0,
        'embs' : 0,
        'gameDayWins' : 0,
        'gameDayLosses' : 0,
        // Array for how many people each game day tie was with.
        'gameDayTiesRec' : [],
        'gameDayEmbs' : 0,
        'goals' : 0
      } ;
      leaderboard[player.id] = playerObj;
    });

    // 
    // Now load all games to determine records
    db.Game.findAll({ 'include' : [ db.Player, db.Goal ]}).then(function (games) {
      games.forEach(function(game) {
        var gpp = util.getGoalsPerPlayerSync(game);
        //console.log("Game %d: ", game.id, gpp);
        Object.keys(gpp).forEach(function(pid) {
          // Win/Loss
          if (game.winner == pid) leaderboard[pid].wins++;
          else if (game.winner !== null) leaderboard[pid].losses++;
          // Embarassments
          if (game.winner !== null && gpp[pid] == 0) leaderboard[pid].embs++;
          // Goals For
          leaderboard[pid].goals += gpp[pid];
        });
      });

      // Find the game day embarrassments and count them as losses as well.
      db.sequelize.query("SELECT DISTINCT PlayerId, count(distinct strftime('%Y%m%d', createdAt)) as count from GamePlayers where not exists (select * from Goals where GamePlayers.PlayerId = Goals.PlayerId AND strftime('%Y%m%d', GamePlayers.createdAt) = strftime('%Y%m%d', Goals.createdAt)) group by playerId;", { type: db.sequelize.QueryTypes.SELECT})
        .then(function(gamedayEmbs) {
          gamedayEmbs.forEach(function(playerGDE) {
            leaderboard[playerGDE.PlayerId].gameDayEmbs = playerGDE.count;
            leaderboard[playerGDE.PlayerId].gameDayLosses = playerGDE.count;
          });

          // Find gameday wins by whoever has the most points on any given day.
          db.sequelize.query("select PlayerId, strftime('%Y%m%d', createdAt) as date, count(strftime('%Y%m%d', createdAt)) as count from Goals group by strftime('%Y%m%d', createdAt), playerId order by strftime('%Y%m%d', createdAt) ASC, count(strftime('%Y%m%d', createdAt)) DESC;", { type: db.sequelize.QueryTypes.SELECT})
            .then(function(rows) {
              // Initialze our variables.
              var date, highCount;
              var winnerIdArr = [];

              rows.forEach(function(row) {
                if (date === row.date)
                {
                  if (row.count === highCount)
                  {
                    // Push the id onto the winner Id Array as a winner
                    winnerIdArr.push(row.PlayerId);
                  }
                  else
                    leaderboard[row.PlayerId].gameDayLosses++;
                }
                else
                {
                  // Iterate through the array and then clear it out for the next date.
                  // after adding the correct values to wins and losses for each player.
                  winnerIdArr.forEach(function(winnerId) {
                  if (winnerIdArr.length == 1)
                    leaderboard[winnerId].gameDayWins += 1
                  else if (winnerIdArr.length > 1)
                    leaderboard[winnerId].gameDayTiesRec.push(winnerIdArr.length);
                  });
                  date = row.date;
                  highCount = row.count;
                  winnerIdArr = [];
                  winnerIdArr.push(row.PlayerId);
                }
              });
              res.json(leaderboard);
            });
        });
    });
  });
});

/**
 * Get a Player's data.
 */
router.get('/:id', function (req, res, next) {
  db.Player.find({ where: { id: req.params.id }}).then(function (player) {
    // Get Player's last game?
    if (player) res.json(player);
    else res.json({});
  });
});

/**
 * Update a player's name (email cannot change)
 */
router.put('/:id', function(req, res, next) {
  db.Player.find({ where: { id: req.params.id, email: req.body.email }}).then(function (player) {
    if (!player)
    {
      res.json({error: 'You cannot update an email address, just a name. Create a new user for each email.'});
    }
    else
    {
      player.updateAttributes({
        name: req.body.name,
        nick: req.body.nick,
        gender: req.body.gender,
        retired: req.body.retired
      }).then(function() {
        res.json(player);
      });
    }
  });
});

/**
 * Create a Player
 */
router.post('/create', function(req, res, next) {
  db.Player.find({ where: { email: req.body.email }}).then(function (player) {
    if (player)
    {
      res.json({error: 'Email address already used'});
    }
    else
    {
      db.Player.create({
        name: req.body.name,
        email: req.body.email,
        nick: req.body.nick,
        retired: req.body.retired,
        gender: req.body.gender
      }).then(function(player) {
        res.json(player);
      });
    }
  });
});

/**
 * Delete a player
 */
router.delete('/:id', function(req, res, next) {
  db.Player.find({ where: { id: req.params.id }}).then(function (player) {
    if (!player)
    {
      res.json({error: 'Player not found with that ID'});
    }
    else
    {
      player.destroy().then(function() {
        res.json({success: true});
      });
    }
  });
});
