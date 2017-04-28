var express = require('express'),
  router = express.Router(),
  db = require('../models');

/**
 * Homepage
 */
module.exports = function (app) {
  app.use('/', router);
};

router.get('/', function (req, res, next) {
  res.render('home', {pagetitle: 'Foosball Tracker'});
});
