/**
 * Players for the game score history
 */
module.exports = function (sequelize, DataTypes) {
  var Player = sequelize.define('Player', {
    name: DataTypes.STRING,
    email: DataTypes.STRING
  }, {
    classMethods: {
      associate: function (models) {
        Player.belongsToMany(models.Game, { through: 'GamePlayers' });
      }
    }
  });

  return Player;
};
