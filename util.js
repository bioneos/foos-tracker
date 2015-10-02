/**
 * Define a set of utility functions for performing common operations on 
 * models, etc.
 */
var util = {
  /**
   * Get the number of goals scored per player as an object.
   * NOTE: This class will throw an exception unless the supplied 'Game' Instance
   *   'included' both the 'Goal' and 'Player' Models when it was created.
   * @param game
   *   Assumed to be a Sequelize Instance of the 'Game' model. See note above.
   * @return 
   *   An object with the following stucture:
   *   {
   *     <PlayerId>: <numGoals>,
   *     ...
   *   }
   */
  getGoalsPerPlayerSync: function(game) {
    if (game.Players === undefined || game.Goals === undefined)
      throw 'Game instance did not "include" both the Goal and Player Models...';
    
    // Now build our Object
    var ret = {};
    //console.log('Found %d Players and %d Goals', game.Players.length, game.Goals.length);
    game.Players.forEach(function(player) {
      ret[player.id] = 0;
    });
    game.Goals.forEach(function(goal) { 
      ret[goal.PlayerId]++;
    });

    // Verify there is no winner to this game 
    // (support for older migration: addition of Game.winner foreign key)
    if (game.winner === null) util.checkGame(game, ret);

    // Return our Object
    return ret;
  },
  /**
   * Support to fix older games (disable at some point?)
   */
  checkGame: function(game, gpp) {
    Object.keys(gpp).forEach(function(pid) {
      var goals = gpp[pid];
      if (goals >= game.threshold) game.winner = pid;
    });
    // Since this is a temporary measure, we can ignore the returned Promise
    if (game.winner !== null)
    {
      console.log('Adding winner to old game (%d)...', game.id);
      game.save();
    }
  }
};

// Export all above defined functions
module.exports = util;
