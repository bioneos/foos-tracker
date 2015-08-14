/**
 * Create a new game and redirect to that game.
 */
function newGame()
{
  $.post('/games/create', {}, function(data, text, xhr) {
    window.location = '/game/' + data.id;
  });
}
