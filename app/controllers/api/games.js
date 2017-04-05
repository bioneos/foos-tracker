var express = require('express'),
  router = express.Router(),
  db = require('../../models');

/**
 * Games API
 *   For listing game stats, visualizations.
 */
module.exports = function (app) {
  app.use('/api/', router);
};

router.get('/games/:start/:end', function (req, res, next) {
  res.send('Nothing to see here yet...');
});
router.get('/games/:start', function (req, res, next) {
  res.send('Nothing to see here yet...');
});
router.get('/games', function (req, res, next) {
  res.send('Nothing to see here yet...');
});
