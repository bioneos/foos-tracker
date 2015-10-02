var express = require('express'),
  router = express.Router(),
  router2 = express.Router(),
  Sequelize = require('sequelize'),
  db = require('../models');

/**
 * Get a static list of unique Players given a list of Games.
 */
function getStaticPlayerList(games)
{
  var list = [];
  games.forEach(function(game) {
    if (!game.Players) return;
    game.Players.forEach(function(player) {
      var exists = false;
      list.forEach(function(li) {
        exists = exists || (li.id == player.id);
      });
      if (!exists)
        list.push({id: player.id, name: player.name, email: player.email});
    });
  });

  return list;
}

module.exports = function (app) {
  app.use('/games', router);
  app.use('/game', router2);
};

/**
 * Page templates:
 */
router2.get('/:id/', function(req, res, next) {
  db.Game.find({ where: { id: req.params.id }}).then(function (game) {
    // TODO: redirect to index but put the messages in a session (so URL is updated)
    if (!game) res.render('index', {messages: ["Cannot find that Game!"] });
    else res.render('game', {gameStart: game.when, gameThreshold: game.threshold, gameId: game.id});
  });
});

router2.post('/:id/rematch', function(req, res, next) {
  db.Game.create({when: new Date()}).then(function(game) {
    // Now get player details (id and name) so we can pass them to the template
    db.Player.findAll({ where: { id : { $in : req.body.players } } }).then(function(dbPlayers) {
      game.addPlayers(dbPlayers).then(function() {
        res.json({ rematchId : game.id }) ;
      })
    }) ;
  });
}) ;

/**
 * JSON routes:
 */
// See the list of the game history (most recent first)
// TODO: pagination eventually?
router.get('/all', function (req, res, next) {
  db.Game.findAll({ order: [['when', 'DESC']]}).then(function (games) {
    // Just return list of id / timestamps
    var ret = {games: []};
    var details = {};
    games.forEach(function(game) {
      details = {id: game.id, when: game.when};
      ret.games.push(details);
    });
    res.json(ret);
  });
});

// See the list of the games for the last week (for the homepage)
router.get('/last-week', function (req, res, next) {
  // Calculate midnight of the current day
  var midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  midnight.setDate(midnight.getDate() - 7);
  var ret = {games: []};
  db.Game.findAll({ 
      where: {when: {$gte: midnight}}, 
      include: [db.Player, db.Goal],
      order: [['when', 'DESC']]
    }).then(function (games) {
    
    // For the week, actually return player goals
    // NOTE: To aid in the D3 viz, we ensure that all games have the
    //   same list of players, in the same order. So start by building
    //   the information for the players list for this week.
    var playerList = getStaticPlayerList(games);

    // Now build the information for the games themselves:
    var details = {};
    games.forEach(function(game) {
      details = {id: game.id, when: game.when};
      details.players = [];
      // Instantiate the player list in the same order with the same values
      playerList.forEach(function(player) {
        details.players.push({id: player.id, name: player.name, email: player.email, goals: 0});
      });
      game.Players.forEach(function(player){
        // Count this user's goals
        var goalCount = 0;
        game.Goals.forEach(function(goal) {
          if (goal.PlayerId == player.id) goalCount++;
        });

        // Update the goals for this player (others remain at 0)
        details.players.forEach(function(inner) {
          if (player.id == inner.id) inner.goals = goalCount;
        });
      });
      ret.games.push(details);
    });

    res.json(ret);
  });
});

// Details for a single game
router.get('/:id', function (req, res, next) {
  // Return value
  var targetGame = {};

  db.Game.find({ where: { id: req.params.id }}).then(function (game) {
    if (!game) res.json(targetGame);
    else
    {
      targetGame.when = game.when;
      targetGame.threshold = game.threshold;
      targetGame.players = {};

      // Get Players Scores
      game.getPlayers().then(function(players) {
        // Initialize goals to zero
        players.forEach(function (player) { 
          targetGame.players[player.id] = {
            id: player.id,
            name: player.name,
            email: player.email,
            goals: []
          };
        });

        // Now record actual counts
        game.getGoals().then(function(goals) {
          goals.forEach(function(goal) {
            targetGame.players[goal.PlayerId].goals.push(goal.id);
          });

          // Send back data
          res.json(targetGame);
        });
      });
    }
  });
});

// Create
router.post('/create', function(req, res, next) {
  db.Game.create({when: new Date()}).then(function(game) {
    res.json({success: true, id: game.id});
  });
});

/**
 * Helper methods.
 */
// Add a Player to an existing game
router.post('/:id/add/player/:pid', function(req, res, next) {
  console.log('Adding a Player to a Game');
  db.Game.find({ where: { id: req.params.id }}).then(function (game) {
    if (!game) res.json({error: 'Invalid Game ID'});
    else
    {
      db.Player.find({ where: { id: req.params.pid }}).then(function(player) {
        if (!player) res.json({error: 'Invalid Player ID'});
        else
        {
          game.addPlayer(player).then(function() {
            res.json({success: 'Player ' + player.name + ' added to Game ID ' + game.id});
          });
        }
      });
    }
  });
});

// Remove a player from a game (they must not have any goals)
router.post('/:id/remove/player/:pid', function(req, res, next) {
  console.log('Removing a Player from a Game');
  db.Game.find({ where: { id: req.params.id }}).then(function (game) {
    if (!game) res.json({error: 'Invalid Game ID'});
    else
    {
      db.Player.find({ where: { id: req.params.pid }}).then(function(player) {
        if (!player) res.json({error: 'Invalid Player ID'});
        else
        {
          game.getGoals().then(function(goals) {
            var count = 0;
            goals.forEach(function(goal) {
              if (goal.PlayerId == player.id) count++;
            });

            if (count > 0)
            {
              res.json({error: "Cannot remove a Player that has already scored. FINISH THAT GAME!"});
            }
            else
            {
              game.removePlayer(player).then(function() {
                res.json({success: 'Player ' + player.name + ' removed from Game ID ' + game.id});
              });
            }
          });
        }
      });
    }
  });
});

// Score a goal
router.post('/:id/goal/player/:pid', function(req, res, next) {
  db.Game.find({ where: { id: req.params.id }}).then(function (game) {
    if (!game) res.json({error: 'Invalid Game ID'});
    else
    {
      db.Player.find({ where: { id: req.params.pid }}).then(function(player) {
        if (!player) res.json({error: 'Invalid Player ID'});
        else
        {
          // Verify that the game is still open
          var sql = "SELECT PlayerId, COUNT(PlayerId) AS c FROM Goals WHERE GameId=? GROUP BY PlayerId ORDER BY c DESC";
          db.sequelize.query(sql, { replacements: [game.id], type: Sequelize.QueryTypes.SELECT }).then(function(rows) {
            if (rows.length > 0 && rows[0].c >= game.threshold)
            {
              res.json({error: 'Game is already closed, Winner (PlayerId): ' + rows[0].PlayerId});
            }
            else
            {
              // Create the goal
              db.Goal.create({ when: new Date() }).then(function(goal) {
                goal.setPlayer(player);
                goal.setGame(game);
                res.json({success: 'Player ' + player.name + ': GOOOOOOOOOOOOOAL!', id: goal.id});
              });

              // Check to see if adding this goal for the player id will hit the threshold, mark it as over and indicate a winner
              rows.forEach(function(row) {
                if (row.PlayerId !== player.id) return ;
                if ((row.c + 1) === game.threshold) game.updateAttributes({ 'winner' : player.id}) ;
              }) ;
            }
          });
        }
      });
    }
  });
});

// Undo a goal (delete)
router.delete('/:id/goal/:gid', function(req, res, next) {
  console.log('Undoing accidental goal button press...');
  db.Game.find({ where: { id: req.params.id }}).then(function (game) {
    if (!game) res.json({error: 'Invalid Game ID'});
    else
    {
      db.Goal.find({ where: { id: req.params.gid }}).then(function(goal) {
        if (!goal) res.json({error: 'Invalid Goal ID'});
        else
        {
          goal.destroy().then(function() {
            res.json({success: 'Goal undone'});
          });
        }
      });
    }
  });
});

// Abort a game, in case of accidental rematch or new game press
router2.delete('/:id', function(req, res, next) {
  db.Game.findById(req.params.id).then(function(game) {
    db.Goal.destroy({ where: { GameId: game.id }}).then(function() {
      game.destroy().then(function () {
        res.json({deleted: true});
      });
    }) ;
  }) ;
}) ;

// Set the threshold of a game
router2.put('/:id/threshold', function(req, res, next) {
  db.Game.findById(req.params.id, { 'include' : db.Goal }).then(function(game) {
    if (!game)
    {
      res.status(404).json({ 'error' : 'Invalid Game ID' }) ;
    }
    else if (!game.Goals || game.Goals.length)
    {
      res.status(403).json({ 'error' : 'Game is already in progress' }) ;
    }
    else if (isNaN(req.body.threshold))
    {
      res.status(400).json({ 'error' : 'The threshold must be an integer' }) ;
    }
    else
    {
      game.updateAttributes({ 'threshold' : req.body.threshold }).then(function() {
        res.json({ 'success' : 'Threshold updated to ' + req.body.threshold }) ;
      })
    }
  }) ;
}) ;