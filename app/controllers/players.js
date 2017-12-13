var express = require('express'),
  router = express.Router(),
  db = require('../models');

/**
 * Players List
 */
module.exports = function (app) {
  app.use('/', router);
};

router.get('/players', function (req, res, next) {
  res.render('players');
});
