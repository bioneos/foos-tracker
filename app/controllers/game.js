var express = require('express'),
  gamesRouter = express.Router(),
  gameRouter = express.Router(),
  Sequelize = require('sequelize'),
  db = require('../models');


/**
 * Expose our configuration function (module-pattern)
 */
module.exports = function (app) {
  app.use('/games', gamesRouter);
  app.use('/game', gameRouter);
};


/** Internal definitions (Routes) **/
/**
 * Page templates:
 */
gameRouter.get('/:id/', function(req, res, next) {
  db.Game.find({ where: { id: req.params.id }}).then(function (game) {
    // TODO: redirect to index but put the messages in a session (so URL is updated)
    if (!game) res.render('index', {messages: ["Cannot find that Game!"] });
    else res.render('game', {
      title: '!Play Foosball!',
      gameStart: game.when, 
      gameThreshold: game.threshold, 
      gameId: game.id
    });
  });
});

/**
 * JSON routes:
 */
// Start a rematch (and send back the new gameId)
gameRouter.post('/:id/rematch', function(req, res, next) {
  db.Game.create({when: new Date()}).then(function(game) {
    // Now get player details (id and name) so we can pass them to the template
    db.Player.findAll({ where: { id : { $in : req.body.players } } }).then(function(dbPlayers) {
      game.addPlayers(dbPlayers).then(function() {
        res.json({ rematchId : game.id }) ;
      })
    }) ;
  });
}) ;

// Abort a game, in case of accidental rematch or new game press
gameRouter.delete('/:id', function(req, res, next) {
  db.Game.findById(req.params.id).then(function(game) {
    db.Goal.destroy({ where: { GameId: game.id }}).then(function() {
      game.destroy().then(function () {
        res.json({deleted: true});
      });
    }) ;
  }) ;
}) ;

// See the list of the game history (most recent first)
// TODO: pagination eventually?
gamesRouter.get('/all', function (req, res, next) {
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

// Details for a single game
gamesRouter.get('/:id', function (req, res, next) {
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
gamesRouter.post('/create', function(req, res, next) {
  db.Game.create({when: new Date()}).then(function(game) {
    res.json({success: true, id: game.id});
  });
});

/**
 * Helper methods.
 */
// Add a Player to an existing game
gamesRouter.post('/:id/add/player/:pid', function(req, res, next) {
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
gamesRouter.post('/:id/remove/player/:pid', function(req, res, next) {
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
gamesRouter.post('/:id/goal/player/:pid', function(req, res, next) {
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
gamesRouter.delete('/:id/goal/:gid', function(req, res, next) {
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
