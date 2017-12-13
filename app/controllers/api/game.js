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
const MAX_UNDO_TIME = 1000 * 60 * 2;
function ActivePlayer() {}
function GameNotFound() {}
function GameInProgress() {}
function GameNotInProgress() {}
function PlayerNotFound() {}
function PlayerNotInGame() {}
function PlayerAlreadyAdded() {}
function NoGoals() {}
function ExceedUndoTimeLimit() {}

/**
 * Score a goal for a specific player in a specific game.
 */
router.post('/game/:game_id/player/:player_id/goal', function (req, res, next) {
  var targetGame = null;
  var targetPlayer = null;

  db.Game.find({ 
    include: [ db.Goal, db.Player ], 
    where: { id: req.params['game_id'] }
  })
  .then(function(game) {
    // Ensure we found our game, and it isn't in progress
    if (!game) throw new GameNotFound();
    else if (game.winner != null) throw new GameNotInProgress();
    targetGame = game;

    // Now find our player
    game.Players.forEach(function(player) {
      if (player.id == req.params['player_id'])
        targetPlayer = player;
    });
    if (!targetPlayer) throw new PlayerNotFound();

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
      res.json({ error: 'Cannot find specified game, GameID: ' + req.params['game_id']});
    }
    else if (err instanceof PlayerNotFound)
    {
      res.statusCode = 404;
      res.json({ error: 'That player is not part of this game, PlayerID: ' + req.params['player_id']});
    }
    else if (err instanceof GameNotInProgress)
    {
      res.statusCode = 409;
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
/**
 * Add a player to a game that is not in progress.
 */
router.post('/game/:game_id/player/:player_id/add', function (req, res, next) {
  playerManagement('add', req, res);
});
/**
 * Delete an existing player from a game.
 */
router.delete('/game/:game_id/player/:player_id', function (req, res, next) {
  playerManagement('remove', req, res);
});
/**
 * Helper method for removal/addition of players.
 */
function playerManagement(type, req, res)
{
  var targetGame = null;
  var targetPlayer = null;
  db.Game.find({ 
    where: { id: req.params['game_id'] },
    include: [ db.Goal, db.Player ]
  })
  .then(function (game) {
    if (!game) throw new GameNotFound();
    if (game.Goals.length > 0) throw new GameInProgress();

    // Search existing players for a match
    game.Players.forEach(function(currentPlayer) {
      if (req.params['player_id'] == currentPlayer.id)
        targetPlayer = currentPlayer;
    });
    
    if (type == 'add' && targetPlayer != null)
      throw new PlayerAlreadyAdded();
    else if (type == 'remove' && targetPlayer == null)
      throw new PlayerNotInGame();

    targetGame = game;
    return db.Player.find({ where: { id: req.params['player_id'] }});
  })
  .then(function(player) {
    if (!player) throw new PlayerNotFound();

    if (type == 'add')
    {
      targetPlayer = player;
      return targetGame.addPlayer(player);
    }
    else if (type == 'remove')
    {
      return targetGame.removePlayer(targetPlayer);
    }
  })
  .then(function() {
    if (type == 'add')
      res.json({ success: 'Player ' + targetPlayer.name + ' added to game, GameID: ' + targetGame.id });
    else if (type == 'remove')
      res.json({ success: 'Player ' + targetPlayer.name + ' removed from game, GameID: ' + targetGame.id });

    throw new Error('Unknown player management action');
  })
  .catch(function(err) {
    if (err instanceof GameNotFound)
    {
      res.statusCode = 404;
      res.json({ error: 'Cannot find that game, GameID: ' + req.params['game_id'] });
    }
    else if (err instanceof PlayerAlreadyAdded)
    {
      res.statusCode = 409;
      res.json({ error: 'That player is already part of the game, GameID: ' + req.params['game_id'] + ', PlayerID: ' + req.params['player_id'] });
    }
    else if (err instanceof PlayerNotInGame)
    {
      res.statusCode = 409;
      res.json({ error: 'That player is not in this game, GameID: ' + req.params['game_id'] + ', PlayerID: ' + req.params['player_id'] });
    }
    else if (err instanceof GameInProgress)
    {
      res.statusCode = 409;
      res.json({ error: 'Cannot change players after goals have been scored, GameID: ' + req.params['game_id'] });
    }
    else if (err instanceof PlayerNotFound)
    {
      res.statusCode = 404;
      res.json({ error: 'Cannot find that player, PlayerID: ' + req.params['player_id'] });
    }
    else
    {
      res.statusCode = 500;
      res.json({ error: err.message });
    }
  });
}

// Game management
/**
 * Undo the last goal scored in a Game. 
 */
router.post('/game/:game_id/undo', function (req, res, next) {
  var targetGoal = null;
  db.Game.find({ include: [ db.Goal ], where: { id: req.params['game_id'] }})
  .then(function(game) {
    if (!game) throw new GameNotFound();

    // Find the newest Goal
    game.Goals.forEach(function(goal) {
      if (targetGoal === null) 
        targetGoal = goal;
      else if (goal.createdAt.getTime() > targetGoal.createdAt.getTime()) 
        targetGoal = goal;
    });

    if (targetGoal === null) 
    {
      throw new NoGoals();
    }
    else if (Date.now() - targetGoal.createdAt.getTime() > MAX_UNDO_TIME)
    {
      throw new ExceedUndoTimeLimit();
    }
    else 
    {
      if (game.winner != null)
      {
        // NOTE: Async update the game (this Promise isn't part of our chain)
        game.winner = null;
        game.save();
      }

      return targetGoal.destroy();
    }
  })
  .then(function() {
    res.json({ 
      success: 'Last goal undone for GameID: ' + req.params['game_id'],
      goal_id: targetGoal.id
    });
  })
  .catch(function(err) {
    if (err instanceof GameNotFound)
    {
      res.statusCode = 404;
      res.json({ error: 'Cannot find that game, GameID: ' + req.params['game_id'] });
    }
    else if (err instanceof NoGoals)
    {
      res.statusCode = 409;
      res.json({ error: 'No goals exist on that game, GameID: ' + req.params['game_id'] });
    }
    else if (err instanceof ExceedUndoTimeLimit)
    {
      res.statusCode = 409;
      res.json({ error: 'Undo time limit exceeded, cannot undo last goal on GameID: ' + req.params['game_id'] });
    }
    else
    {
      res.statusCode = 500;
      res.json({ error: err.message });
    }
  });
});

/**
 * Create a new game with the same players (Rematch).
 */
router.post('/game/:game_id/rematch', function (req, res, next) {
  db.Game.create({when: new Date()})
  .then(function(newGame) {
    // Now get player details (id and name) so we can pass them to the template
    // TODO: flatten
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
 * Get Game details for the last played game
 */
router.get('/game/last', function (req, res, next) {
  db.Game.findOne({
    order: [[ 'when', 'DESC' ]],
    include: [ db.Player, db.Goal ]
  })
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
 * Get Game timeline details. The format of the response was dictated by the
 * previous API implementation, and I think we might want to change it eventually.
 * But for now, it will work with the existing graph with this form. Any changes
 * would require a change to the Game timeline graph.
 */
router.get('/game/timeline/:game_id/', function (req, res, next) {
  db.Game.findById(req.params['game_id'], { include: [ db.Player, db.Goal ]})
  .then(function(game) {
    if (game == null) 
    {
      res.statusCode = 404;
      return res.json({});
    }
    
    // Found the game, not transform into our expected timeline format
    var ret = { 
      id: game.id,
      when: game.when,
      threshold: game.threshold,
      goals: {}
    };
    // Build an easier to use Player map, and initialize everyone's goals array
    var pmap = {};
    game.Players.forEach(function(player) { 
      pmap[player.id] = player; 
      ret.goals[player.nick] = [{ num: 0, when: game.when }];
    });
    // Build the goals timeline
    game.Goals.forEach(function(goal) {
      var nick = pmap[goal.PlayerId].nick;
      ret.goals[nick].push({
        num: ret.goals[nick].length,
        when: goal.when,
      });
    });
    ret.winner = (game.winner) ? pmap[game.winner].nick : null;
    res.json(ret);
  })
  .catch(function(err) {
    res.statusCode = 500;
    res.json({ error: err.message });
  });
});

/**
 * Get basic Game details.
 */
router.get('/game/:game_id/', function (req, res, next) {
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
  var targetGame = null;
  db.Game.findById(req.params['game_id'], { include: [ db.Goal ]})
  .then(function(game) {
    if (!game)
      throw new GameNotFound();
    if (game.Goals.length > 0)
      throw new ActivePlayer();

    targetGame = game;

    // Remove all Players first
    return game.setPlayers([]);
  })
  .then(function() {
    return targetGame.destroy();
  })
  .then(function() {
    res.json({ 
      success: 'Successfully deleted game, GameID: ' + req.params['game_id'],
      deleted: true
    });
  })
  .catch(function(err) {
    if (err instanceof GameNotFound)
    {
      res.statusCode = 404;
      res.json({ error: 'Cannot find that game, GameID: ' + req.params['game_id']});
    }
    else if (err instanceof ActivePlayer)
    {
      res.statusCode = 409;
      res.json({ error: 'You cannot delete a Game in which Players have already scored a Goal'});
    }
    else
    {
      res.statusCode = 500;
      res.json({ error: err.message });
    }
  });
});