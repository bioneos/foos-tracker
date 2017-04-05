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

router.get('/player/:id', function (req, res, next) {
  res.send('Nothing to see here yet...');
});
router.put('/player/:id', function (req, res, next) {
  res.send('Nothing to see here yet...');
});
router.delete('/player/:id', function (req, res, next) {
  res.send('Nothing to see here yet...');
});
router.post('/player/create', function (req, res, next) {
  res.send('Nothing to see here yet...');
});
