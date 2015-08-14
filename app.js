

var express = require('express'),
  config = require('./config/config'),
  db = require('./app/models');

var app = express();

require('./config/express')(app, config);

console.log('Starting up on: ' + config.port);
console.log('  DB: ' + config.db);

db.sequelize
  .sync()
  .then(function () {
    app.listen(config.port);
  }).catch(function (e) {
    throw new Error(e);
  });

