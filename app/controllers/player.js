var express = require('express'),
  router = express.Router(),
  db = require('../models');

module.exports = function (app) {
  app.use('/players', router);
};

/**
 * Page templates:
 */
router.get('/create', function(req, res, next) {
  // Just serve up our create UI
  res.render('player') ;
}) ;

router.get('/:id/edit', function(req, res, next) {
  if (isNaN(req.params.id)) res.status(400).end() ;

  // This is an edit, so attempt to find our player
  db.Player.find({ where : { id: req.params.id }}).then(function(player) {
    if (player) res.render('player', { id: req.params.id,  name: player.name, email: player.email }) ;
    else res.render('player', { idNotFound: true }) ;
  }) ;
}) ;

router.get('/:id/stats', function(req, res, next) {

}) ;

/**
 * JSON routes:
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

// Leaderboard of all players
router.get('/leaderboard', function(req, res, next) {
  var leaderboard = [] ;
  var games = {} ;

  // Load up our players for our game summary table
  db.Player.findAll({ 'include' : [ db.Game, db.Goal ]}).then(function (players) {
    players.forEach(function(player) {
      // Get the players games
      var playerObj = {
        'name' : player.name,
        'nick' : player.nick,
        'retired' : player.retired,
        'wins' : 0,
        'loses' : 0,
        'embs' : 0,
        'goals' : 0
      } ;

      player.Goals.forEach(function(goal) {
        if (!games[goal.GameId]) games[goal.GameId] = {} ;
        if (!games[goal.GameId][goal.PlayerId]) games[goal.GameId][goal.PlayerId] = 0 ;
        games[goal.GameId][goal.PlayerId]++ ;
      }) ;

      // For every game this player is in, tally our goals/wins/losses/embarrassments
      player.Games.forEach(function(game) {
        playerObj.goals += player.Goals.length ;

        // Handle our outcomes
        if (player.Goals.length === game.threshold)
        {
          playerObj.wins++ ;
        }
        else
        {
          playerObj.loses++ ;
          if (player.Goals.length === 0) playerObj.embs++ ;
        }
      }) ;

      leaderboard.push(playerObj) ;
    }) ;

    console.log(games) ;

  });
}) ;

router.get('/:id', function (req, res, next) {
  db.Player.find({ where: { id: req.params.id }}).then(function (player) {
    // Get Player's last game?
    if (player) res.json(player);
    else res.json({});
  });
});

// Update a player's name (email cannot change)
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

// Create
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

// Delete a player
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