/**
 * Goals scored in a single game
 */
module.exports = function (sequelize, DataTypes) {

  var Goal = sequelize.define('Goal', {
    when: DataTypes.DATE
  }, {
    classMethods: {
      associate: function (models) {
        Goal.belongsTo(models.Player);
        Goal.belongsTo(models.Game);
      }
    }
  });

  return Goal;
};

