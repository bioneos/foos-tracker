var express = require('express'),
  router = express.Router(),
  db = require('../../models');

/**
 * Goals API
 *   For getting a goals timeline for a single game.
 */
module.exports = function (app) {
  app.use('/api/', router);
};

router.get('/goals/:game_id', function (req, res, next) {
  res.send('Nothing to see here yet...');
});
