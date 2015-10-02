/**
 * Fill up the players-list with the current players of this game, 
 * and add their GOAL buttons, then add the remaining players to the
 * controls for addition to this game. Finally initialize the current
 * score for the game.
 *
 * NOTE: This method should only be called once the document is ready.
 */
function initGamePage()
{
  $.get('/players/all/', {}, function(data, text, xhr) {
    var allPlayers = data.players;
    $.get('/games/' + gameId, {}, function(data, text, xhr) {
      // Player info
      allPlayers.forEach(function(player) {
        if (data.players[player.id])
          addActivePlayer(player);
        else
          addAvailablePlayer(player);
      });

      // Current Game info
      refreshGameInfo();
    });
  });

  // Init our Semantic UI dropdown
  $('.ui.dropdown').dropdown();
}

/**
 * Helper method to add an active player for the Game Init method. 
 * Includes their "Goal" button, and placeholder on the Scoreboard.
 */
function addActivePlayer(player)
{
  var button = '<a href="#" onclick="removeActivePlayer(' + player.id + ')"><i class="fa fa-lg fa-remove"></i></a>' ;
  button += '<button class="ui button" onclick="score(' + player.id + ');">Goal!</button>' ;
  button += '<a href="#" onclick="undoGoal(' + player.id + ', event)"><i class="fa fa-lg fa-undo"></i></a>';
  $('#players-list').append('<li class="ui column" id="player-list-' + player.id + '"><p>' + player.name + '</p>' + button + '</li>');

  // Add player to the Scoreboard
  $('#scoreboard').append('<div class="ui column" id="player-score-' + player.id + '">' + 
    '<h2>0</h2><p>' + player.name + '</p>' +
    '</div>');

  // Add player score to memory
  game[player.id] = [];
}

function removeActivePlayer(playerId)
{
  if (gameInProgress) return false ;

  // Get our player name from the DOM
  var name = $('#player-list-' + playerId + ' p').text() ;

  // Remove the player from the UI and add them back to the player list
  $('#player-list-' + playerId).remove() ;
  $('#player-score-' + playerId).remove() ;
  addAvailablePlayer({ 'id' : playerId,  'name' : name }) ;
}

/**
 * Helper method to add an available player to the dropdown list.
 */
function addAvailablePlayer(player)
{
  var opt = '<option id="player-available-' + player.id + '" value="' + player.id + '">' + player.name + '</option>';
  $('#players .controls select').append(opt);
}

/**
 * Add the currently selected available player to the game.
 */
function joinGame()
{
  var pid = $('#players .controls select').val();
  if (pid <= 0) return;

  $.get('/players/' + pid, {}, function(player, text, xhr) {
    $.post('/games/' + gameId + '/add/player/' + pid, {}, function(data, text, xhr) {
      addActivePlayer(player);
      // Success! Remove from available list
      $('#player-available-' + pid).remove();
    });
  });
}

/**
 * Score a goal.
 */
function score(pid)
{
  // When a goal is scored, the game is officially in progress
  gameInProgress = true ;

  $.post('/games/' + gameId + '/goal/player/' + pid, {}, function(data, text, xhr) {
    // Update Scoreboard
    game[pid].push(data.id);
    $('#player-score-' + pid).children('h2').replaceWith('<h2>' + game[pid].length + '</h2>');

    // We have a winner (verify by talking to the server)
    if (game[pid].length >= gameThreshold) refreshGameInfo();
  });
}

/**
 * Remove an errant goal
 */
function undoGoal(pid, e)
{
  e.preventDefault() ;

  if (!game[pid] || game[pid].length === 0) return ;

  var lastGoal = game[pid].pop() ;
  $.ajax({
    'url' : '/games/' + gameId + '/goal/' + lastGoal,
    'method' : 'DELETE',
    'success' : function() {
      // Our goal has already been removed from the stack, update our UI
      $('#player-score-' + pid).children('h2').replaceWith('<h2>' + game[pid].length + '</h2>');
    },
    'error' : function() {
      // Dont update our UI and put the failed goal back on the stack
      game[pid].push(lastGoal) ;

      // TODO: Should have a user warning here of the failure to remove the goal
    }
  }) ;
}

/**
 * Get the game info. (Display winner if anyone has > 5 goals)
 */
function refreshGameInfo()
{
  $.get('/games/' + gameId, {}, function(data, text, xhr) {
    var winner = null;
    for (var pid in data.players)
    {
      // Check for a winner
      if (data.players[pid].goals.length >= data.threshold)
      {
        // Just in case threshold was set wrong
        if (!winner || data.players[pid].goals.length > winner.goals)
          winner = data.players[pid];
      }

      // Update player score
      if (data.players[pid].goals.length > 0)
      {
        gameInProgress = true ;
      }

      game[pid] = data.players[pid].goals;
      $('#player-score-' + pid).children('h2').replaceWith('<h2>' + game[pid].length + '</h2>');
    } 

    // Close the game out
    if (winner) showWinner(winner);
  });
}

/**
 * Display the winner of this game, and button to create a new game.
 */
function showWinner(winner)
{
  $('#winner').append('<h2>' + winner.name + ' Crushed It!!!</h2>');
  // Disable all goal buttons
  $('#players-list li button').prop("disabled", true);
  // Disable Join button
  $('#players .controls button').prop("disabled", true);

  // New game button
  $('#winner').append('<button class="ui massive button" onclick="newGame();">Play a new Game</button>');
  $('#winner').append('<button class="ui massive button" onclick="rematch();">Rematch</button>');
  $('#winner').fadeIn();
}

/**
 * Rematch the current players in a new game
 */
function rematch()
{
  // Make a call to start a new game, that call will automatically redirect us
  $.post('/game/' + gameId + '/rematch', { 'players' : Object.keys(game) }, function(data, status, xhr) {
    window.location = '/game/' + data.rematchId;
  }) ;
}

function abortGame(event)
{
  event.stopPropagation() ;

  $.ajax({
    'url' : '/game/' + gameId,
    'method' : 'DELETE',
    'success' : function() {
      window.location = '/' ;
    }
  }) ;
}

/**
 * Update the threshold of a new game (one with no goals)
 */
function setThreshold(newThresh)
{
  if (isInProgress())
  {
    console.debug('Game is in session, cannot change threshold') ;

    return false ;
  }

  $.ajax({
    'url' : '/game/' + gameId + '/threshold',
    'method' : 'PUT',
    'data' : { 'threshold' : newThresh },
    'success' : function(data) {
      console.debug(data) ;
    }
  })
}

/**
 * Utility function to determine if the game is in progress (goals exist)
 **/
function isInProgress()
{
  return Object.keys(game).reduce(function(prevGoals, currentPlayerId) {
    return prevGoals + game[currentPlayerId].length ;
  }, 0) ;
}