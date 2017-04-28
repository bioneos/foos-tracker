var express = require('express'),
  gamesRouter = express.Router(),
  gameRouter = express.Router(),
  Sequelize = require('sequelize'),
  db = require('../models');


/**
 * Expose our configuration function (module-pattern)
 */
module.exports = function (app) {
  app.use('/games', gamesRouter);
  app.use('/game', gameRouter);
};


/** Internal definitions (Routes) **/
/**
 * Page templates:
 */
gameRouter.get('/:id/', function(req, res, next) {
  db.Game.find({ where: { id: req.params.id }}).then(function (game) {
    // TODO: redirect to index but put the messages in a session (so URL is updated)
    if (!game) res.render('index', {messages: ["Cannot find that Game!"] });
    else res.render('game', {
      title: '!Play Foosball!',
      gameStart: game.when, 
      gameThreshold: game.threshold, 
      gameId: game.id
    });
  });
});
