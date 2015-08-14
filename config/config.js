var path = require('path'),
    rootPath = path.normalize(__dirname + '/..'),
    env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'foos-tracker'
    },
    port: 3000,
    db: 'sqlite://localhost/foos-tracker-development',
    storage: rootPath + '/data/foos-tracker-development'
  },

  test: {
    root: rootPath,
    app: {
      name: 'foos-tracker'
    },
    port: 3030,
    db: 'sqlite://localhost/foos-tracker-test',
    storage: rootPath + '/data/foos-tracker-test'
  },

  production: {
    root: rootPath,
    app: {
      name: 'foos-tracker'
    },
    port: 3030,
    db: 'sqlite://localhost/foos-tracker-production',
    storage: rootPath + '/data/foos-tracker-production'
  }
};

module.exports = config[env];
