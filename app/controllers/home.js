var express = require('express'),
  router = express.Router(),
  db = require('../models');

module.exports = function (app) {
  app.use('/', router);
};

router.get('/', function (req, res, next) {
  res.render('index', {pagetitle: 'Foosball Tracker'});
});

  /*db.Game.findAll().success(function (games) {
    res.render('index', {
      title: 'Foosball Score Tracker',
      games: games
    });
  });*/
