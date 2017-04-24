var express = require('express'),
  router = express.Router(),
  db = require('../../models');

/**
 * Game API
 *   For controlling or watching games in progress.
 */
module.exports = function (app) {
  app.use('/api/', router);
};

/**
 * Define possible error situations.
 */
function GameNotFound() {}
function GameNotInProgress() {}
function PlayerNotFound() {}

/**
 * Score a goal for a specific player in a specific game.
 */
router.post('/game/:game_id/player/:player_id/goal', function (req, res, next) {
  var targetGame = null;
  var targetPlayer = null;

  db.Game.find({ include: [ db.Goal ], where: { id: req.params['game_id'] }})
  .then(function(game) {
    if (!game) throw new GameNotFound();
    else if (game.winner != null) throw new GameNotInProgress();

    targetGame = game;
    return db.Player.find({ where: {id: req.params['player_id'] }});
  })
  .then(function(player) {
    // TODO: Better yet, only search within players associated with this
    // game so that outside players cannot "score".
    if (!player) throw new PlayerNotFound();
    targetPlayer = player;

    return db.Goal.create({ when: new Date() })
  })
  .then(function(goal) {
    goal.setPlayer(targetPlayer);
    goal.setGame(targetGame);

    var count = 0;
    var response = { 
      success: 'Player ' + targetPlayer.name + ': GOOOOOOOOOAL!', 
      id: goal.id 
    };
    targetGame.Goals.forEach(function(goal) {
      if (goal.PlayerId == targetPlayer.id) count++;
    });
    if (count + 1 >= targetGame.threshold)
    {
      targetGame.updateAttributes({ 'winner': targetPlayer.id });
      response.winner = true;
    }

    res.json(response);
  })
  .catch(function(err) {
    if (err instanceof GameNotFound)
    {
      res.statusCode = 404;
      res.json({ error: 'Cannot find that game'});
    }
    else if (err instanceof PlayerNotFound)
    {
      res.statusCode = 404;
      res.json({ error: 'Cannot find that player'});
    }
    else if (err instanceof GameNotInProgress)
    {
      res.statusCode = 401;
      res.json({ error: 'That game is no longer in progress' });
    }
    else
    {
      res.statusCode = 500;
      res.json({ error: 'Unknown internal error: ' + err });
    }
  });
});

// Player management
router.post('/game/:game_id/player/add', function (req, res, next) {
  res.send('Nothing to see here yet...');
});
router.delete('/game/:game_id/player/:player_id', function (req, res, next) {
  res.send('Nothing to see here yet...');
});

// Game management

router.put('/game/:game_id/undo', function (req, res, next) {
  res.send('Nothing to see here yet...');
});

/**
 * Create a new game with the same players (Rematch).
 */
router.post('/game/:game_id/rematch', function (req, res, next) {
  db.Game.create({when: new Date()})
  .then(function(newGame) {
    // Now get player details (id and name) so we can pass them to the template
    db.Game.findById(req.params['game_id'], { include: [ db.Player ] })
    .then(function(game) {
      return newGame.addPlayers(game.Players)
    })
    .then(function() {
      res.json({ players: newGame.Players, rematchId : newGame.id }) ;
    })
    .catch(function(err) {
      res.json({ 
        message: 'Warning: not all players could be added to the Game!', 
        error: err.message,
        rematchId: newGame.id
      });
    });
  })
  .catch(function(err) {
    res.statusCode = 500;
    res.json({ error: err.message });
  });
});

/**
 * Create a new Game (no Players).
 */
router.post('/game/create', function (req, res, next) {
  db.Game.create({when: new Date()})
  .then(function(newGame) {
    res.json({ id: newGame.id });
  })
  .catch(function(err) {
    res.statusCode = 500;
    res.json({ error: err.message });
  });
});

/**
 * Get Game details.
 */
router.get('/game/:game_id', function (req, res, next) {
  db.Game.findById(req.params['game_id'], { include: [ db.Player, db.Goal ]})
  .then(function(game) {
    if (game == null) 
    {
      res.statusCode = 404;
      game = {};
    }
    res.json(game);
  })
  .catch(function(err) {
    res.statusCode = 500;
    res.json({ error: err.message });
  });
});

/**
 * Delete a Game. Requires that 0 Goals have been score, but can remove
 * any number of associated Players.
 */
router.delete('/game/:game_id', function (req, res, next) {
  db.Game.findById(req.params['game_id'], { include: [ db.Goal ]})
  .then(function(game) {
    if (game.Goals.length > 0)
      throw new Error('You cannot delete a Game in which Players have already scored a Goal');

    // Remove all Players first
    var deferred = game.setPlayers([])
      .then(function() {
        console.log("HELLO ", game);
        return game.destroy();
      });
    return deferred;
  })
  .then(function() {
    res.json({deleted: true});
  })
  .catch(function(err) {
    res.statusCode = 500;
    res.json({ error: err.message });
  });
});
