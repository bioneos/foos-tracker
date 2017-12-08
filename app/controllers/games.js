var express = require('express'),
  router = express.Router(),
  db = require('../models');

/**
 * Game functionality
 */
module.exports = function (app) {
  app.use('/', router);
};

router.get('/games', function (req, res, next) {
  res.render('games');
});
