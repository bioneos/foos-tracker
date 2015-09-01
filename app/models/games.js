/**
 * Games history
 */
module.exports = function (sequelize, DataTypes) {

  var Game = sequelize.define('Game', {
    when: DataTypes.DATE,
    threshold: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5},
    winner : {
      type: DataTypes.INTEGER,
      references: {
        model: 'Players',
        key: 'id'
      }
    }
  }, {
    classMethods: {
      associate: function (models) {
        Game.belongsToMany(models.Player, { through: 'GamePlayers' });
        Game.hasMany(models.Goal);
      }
    }
  });

  return Game;
};