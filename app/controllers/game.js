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
    if (!game) 
    {
      // TODO: either session message here, or query string
      res.redirect('/');
    }
    else 
    {
      res.render('game', {
        title: '!Play Foosball!',
        gameStart: game.when, 
        gameThreshold: game.threshold, 
        gameId: game.id
      });
    }
  });
});
