var express = require('express'),
  router = express.Router(),
  Sequelize = require('sequelize'),
  db = require('../models');

module.exports = function (app) {
  app.use('/stats', router);
};


/** Page Routes: **/
/**
 * Render the history page using our history template.
 */
router.get('/', function(req, res, next) {
  // TODO: leaderboard vs visualize in separate tabs
  res.render('statistics', {title: 'Statistics'});
});

