var express = require('express'),
  router = express.Router(),
  db = require('../models');

module.exports = function (app) {
  app.use('/players', router);
};

/**
 * Create a Player page.
 */
router.get('/create', function(req, res, next) {
  // Just serve up our create UI
  res.render('player', { title: 'Create Player'}) ;
}) ;

/**
 * Edit a Player page.
 */
router.get('/:id/edit', function(req, res, next) {
  if (isNaN(req.params.id)) res.status(400).end() ;

  // This is an edit, so attempt to find our player
  db.Player.find({ where : { id: req.params.id }}).then(function(player) {
    if (player) res.render('player', { title: 'Edit Player', player: player }) ;
    else res.render('player', { title: 'Edit Player', idNotFound: true }) ;
  }) ;
}) ;

