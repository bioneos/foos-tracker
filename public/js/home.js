/**
 * Create a new game and redirect to that game.
 */
function newGame()
{
  $.post('/api/game/create', {}, function(data, text, xhr) {
    window.location = '/game/' + data.id;
  });
}
