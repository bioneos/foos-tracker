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

/**
 * JSON routes:
 */


// Remove a player from a game (they must not have any goals)
gamesRouter.post('/:id/remove/player/:pid', function(req, res, next) {
  console.log('Removing a Player from a Game');
  db.Game.find({ where: { id: req.params.id }}).then(function (game) {
    if (!game) res.json({error: 'Invalid Game ID'});
    else
    {
      db.Player.find({ where: { id: req.params.pid }}).then(function(player) {
        if (!player) res.json({error: 'Invalid Player ID'});
        else
        {
          game.getGoals().then(function(goals) {
            var count = 0;
            goals.forEach(function(goal) {
              if (goal.PlayerId == player.id) count++;
            });

            if (count > 0)
            {
              res.json({error: "Cannot remove a Player that has already scored. FINISH THAT GAME!"});
            }
            else
            {
              game.removePlayer(player).then(function() {
                res.json({success: 'Player ' + player.name + ' removed from Game ID ' + game.id});
              });
            }
          });
        }
      });
    }
  });
});


