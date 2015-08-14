var express = require('express'),
  router = express.Router(),
  db = require('../models');

module.exports = function (app) {
  app.use('/players', router);
};

router.get('/all', function (req, res, next) {
  db.Player.findAll().success(function (players) {
    var ret = {players: []};
    var details = {};
    players.forEach(function(player) {
      details = {id: player.id, name: player.name, email: player.email };
      ret.players.push(details);
    });
    res.json(ret);
  });
});
router.get('/:id', function (req, res, next) {
  db.Player.find({ where: { id: req.params.id }}).success(function (player) {
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
      player.updateAttributes({ name: req.body.name }).then(function() {
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
      db.Player.create({name: req.body.name, email: req.body.email}).then(function(player) {
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
