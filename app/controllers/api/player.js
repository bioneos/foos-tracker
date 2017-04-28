var express = require('express'),
  router = express.Router(),
  db = require('../../models');

/**
 * Player API
 *   For basic player management.
 */
module.exports = function (app) {
  app.use('/api/', router);
};

/**
 * Get Player details (by id).
 */
router.get('/player/:id', function (req, res, next) {
  db.Player.find({ where: { id: req.params.id }}).then(function (player) {
    res.json(player || {});
  })
  .catch(function(err) {
    res.statusCode = 500;
    res.json({ error: err });
  });
});
/**
 * Update Player details.
 */
router.put('/player/:id', function (req, res, next) {
  db.Player.find({ where: { id: req.params.id, email: req.body.email }}).then(function (player) {
    if (!player)
    {
      res.statusCode = 403;
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
 * Delete a Player
 * TODO: only allowed if they've never played, instead just retire.
 */
router.delete('/player/:id', function (req, res, next) {
  db.Player.find({ where: { id: req.params.id }}).then(function (player) {
    if (!player)
    {
      res.statusCode = 404;
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

/**
 * Create a new Player.
 */
router.post('/player/create', function (req, res, next) {
  db.Player.find({ where: { email: req.body.email }}).then(function (player) {
    if (player)
    {
      res.statusCode = 403;
      res.json({ error: 'Email address already used' });
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
