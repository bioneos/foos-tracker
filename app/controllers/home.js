var express = require('express'),
  router = express.Router(),
  db = require('../models');

module.exports = function (app) {
  app.use('/', router);
};

router.get('/', function (req, res, next) {
  res.render('index', {title: 'BN Foosball Score Tracker'});
});
router.get('/history', function (req, res, next) {
  // TODO: get score of last game
  // Maybe graph?
  res.render('history', {title: 'Score History :: BN Foosball Score Tracker'});
});

  /*db.Game.findAll().success(function (games) {
    res.render('index', {
      title: 'Foosball Score Tracker',
      games: games
    });
  });*/
