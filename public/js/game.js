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
  var button = '<button class="ui button" onclick="score(' + player.id + ');">Goal!</button>';
  $('#players-list').append('<li class="ui column"><p>' + player.name + '</p>' + button + '</li>');

  // Add player to the Scoreboard
  $('#scoreboard').append('<div class="ui column" id="player-score-' + player.id + '">' + 
    '<h2>0</h2><p>' + player.name + '</p>' +
    '</div>');

  // Add player score to memory
  game[player.id] = 0;
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
  $.post('/games/' + gameId + '/goal/player/' + pid, {}, function(data, text, xhr) {
    // Update Scoreboard
    game[pid]++;
    $('#player-score-' + pid).children('h2').replaceWith('<h2>' + game[pid] + '</h2>');

    // We have a winner (verify by talking to the server)
    if (game[pid] >= gameThreshold) refreshGameInfo();
  });
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
      if (data.players[pid].goals >= data.threshold) 
      {
        // Just in case threshold was set wrong
        if (!winner || data.players[pid].goals > winner.goals)
          winner = data.players[pid];
      }

      // Update player score
      game[pid] = data.players[pid].goals;
      $('#player-score-' + pid).children('h2').replaceWith('<h2>' + game[pid] + '</h2>');
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
  $('#winner').fadeIn();
}
