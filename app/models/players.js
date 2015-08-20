/**
 * Players for the game score history
 */
module.exports = function (sequelize, DataTypes) {
  var Player = sequelize.define('Player', {
    name: DataTypes.STRING,
    gender: DataTypes.STRING,
    nick: DataTypes.STRING,
    email: DataTypes.STRING,
    retired: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function (models) {
        Player.belongsToMany(models.Game, { through: 'GamePlayers' });
      }
    }
  });

  return Player;
};