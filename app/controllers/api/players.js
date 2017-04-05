var express = require('express'),
  router = express.Router(),
  db = require('../../models');

/**
 * Players API
 *   For viewing player data for all players.
 */
module.exports = function (app) {
  app.use('/api/', router);
};

router.get('/players', function (req, res, next) {
  res.send('Nothing to see here yet...');
});
