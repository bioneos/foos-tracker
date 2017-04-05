var express = require('express'),
  router = express.Router(),
  db = require('../../models');

/**
 * Game API
 *   For controlling or watching games in progress.
 */
module.exports = function (app) {
  app.use('/api/', router);
};

// Actions (goals)
router.post('/game/:game_id/player/:player_id/goal', function (req, res, next) {
  res.send('Nothing to see here yet...');
});

// Player management
router.post('/game/:game_id/player/add', function (req, res, next) {
  res.send('Nothing to see here yet...');
});
router.delete('/game/:game_id/player/:player_id', function (req, res, next) {
  res.send('Nothing to see here yet...');
});

// Game management
router.put('/game/:game_id/undo', function (req, res, next) {
  res.send('Nothing to see here yet...');
});
router.post('/game/create', function (req, res, next) {
  res.send('Nothing to see here yet...');
});
router.post('/game/rematch', function (req, res, next) {
  res.send('Nothing to see here yet...');
});
router.get('/game/:game_id', function (req, res, next) {
  res.send('Nothing to see here yet...');
});
router.delete('/game/:game_id', function (req, res, next) {
  res.send('Nothing to see here yet...');
});
