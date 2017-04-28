// TODO: The globally defined "game" variable is very fragile, and
//   lacking other important game details. We need to switch to a
//   more robust way of doing this.
var game = {};

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
  $.get('/api/players/', {}, function(playerData, text, xhr) {
    var allPlayers = playerData.players;
    $.get('/api/game/' + gameId, {}, function(gameData, text, xhr) {
      // Player info
      allPlayers.forEach(function(player) {
        var match = gameData.Players.find(function(p) { return (p.id === player.id); });
        if (match)
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
  var removeButton = ' <a href="#" onclick="removeActivePlayer(' + player.id + ')"><i class="fa fa-lg fa-remove"></i></a> ' ;
  var goalButton = '<button class="ui button" onclick="score(' + player.id + ');">Goal!</button>' ;
  $('#players-list').append('<li class="ui column" id="player-list-' + player.id + '"><p>' + player.name + removeButton + '</p>' + goalButton + '</li>');

  // Add player to the Scoreboard
  $('#scoreboard').append('<div class="ui column" id="player-score-' + player.id + '">' + 
    '<h2>0</h2><p>' + player.name + '</p>' +
    '</div>');

  // Add player score to memory
  game[player.id] = [];
}

function removeActivePlayer(playerId)
{
  // Get our player name from the DOM
  var name = $('#player-list-' + playerId + ' p').text() ;
  $.ajax({
    'url' : '/api/game/' + gameId + '/player/' + playerId,
    'method' : 'DELETE',
    'success' : function() {
      // Remove the player from the UI and add them back to the player list
      $('#player-list-' + playerId).remove() ;
      $('#player-score-' + playerId).remove() ;
      addAvailablePlayer({ 'id' : playerId,  'name' : name }) ;
    },
    'error' : function(jqXHR, text, err) {
      // TODO: improve this
      alert('Could not remove that player: ' + jqXHR.responseJSON.error);
    }
  }) ;
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

  $.get('/api/player/' + pid, {}, function(player, text, xhr) {
    $.post('/api/game/' + gameId + '/player/' + pid + '/add', {}, function(data, text, xhr) {
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
  var url = '/api/game/' + gameId + '/player/' + pid + '/goal';
  $.post(url, {}, function(data, text, xhr) {
    // Update Scoreboard
    game[pid].push(data.id);
    $('#player-score-' + pid).children('h2').replaceWith('<h2>' + game[pid].length + '</h2>');

    // We have a winner (verify by talking to the server)
    if (game[pid].length >= gameThreshold) refreshGameInfo();
  });
}

/**
 * Undo the last Goal button press.
 */
function undoGoal()
{
  $.ajax({
    'url' : '/api/game/' + gameId + '/undo',
    'method' : 'POST',
    'success' : function(data) {
      // Ensure we are on the same page as the server
      refreshGameInfo();
    },
    'error' : function() {
      // TODO: Should have a user warning here of the failure to remove the goal
    }
  }) ;
}

/**
 * Get the game info. (Display winner if anyone has > 5 goals)
 */
function refreshGameInfo()
{
  // Reseting all local data:
  game = {};

  $.get('/api/game/' + gameId, {}, function(data, text, xhr) {
    var winnerId = data.winner;
    var winner = null;
    
    // Sum all goals
    data.Goals.forEach(function(goal) {
      game[goal.PlayerId] = game[goal.PlayerId] || [];
      game[goal.PlayerId].push(goal.id);
    });

    // Update player scores
    data.Players.forEach(function(player) {
      game[player.id] = game[player.id] || [];
      $('#player-score-' + player.id).children('h2').replaceWith('<h2>' + game[player.id].length + '</h2>');

      if (winnerId === player.id)
        winner = player;
    });

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
  $.post('/api/game/' + gameId + '/rematch', {}, function(data, status, xhr) {
    window.location = '/game/' + data.rematchId;
  }) ;
}

function abortGame()
{
  // TODO: what to do on error?
  $.ajax({
    'url' : '/api/game/' + gameId,
    'method' : 'DELETE',
    'success' : function() {
      window.location = '/' ;
    }
  }) ;
}
