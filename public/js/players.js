/**
 * Methods to handle player operations (create, updates, deletes)
 */
function initPlayerForm()
{
  // Setup our form validation
  $('.ui.form').form({
    'fields' : {
      'name' : {
        'identifier' : 'name',
        'rules' : [
          {
            'type': 'empty',
            'prompt' : 'Please enter a name for this player'
          }
        ]
      },
      'email' : {
        'identifier' : 'email',
        'rules' : [
          {
            'type': 'email',
            'prompt' : 'Please enter an email address for this player'
          }
        ]
      }
    },
    'onSuccess' : function() {
      // Call our own method for submitting, return false to cancel the standard submission
      var values = $('.ui.form').form('get values') ;
      var playerOpts = {
        'name' : values.name,
        'email' : values.email
      } ;

      // Add our optional player opts
      if (values.nick) playerOpts.nick = values.nick ;
      if (values.gender) playerOpts.gender = values.gender ;
      // TODO: Will this work? retired could be false-y, but present
      if (values.retired) playerOpts.retired = retired ;

      createPlayer(playerOpts) ;
      return false ;
    }
  }) ;
}

function createPlayer(playerOpts)
{
  var playerId = $('#playerId').val() ;
  $.ajax(playerId ? '/players/' + playerId : '/players/create', {
    'method' : playerId ? 'PUT' : 'POST',
    'data' : playerOpts,
    'success' : function() {
      $('#message').removeClass('error success').addClass('success') ;
      $('#message').html('The player was successfully created and ready to rock!') ;
    },
    'error' : function(xhr, status, error) {
      $('#message').removeClass('error success').addClass('error') ;
      $('#message').html('Dang, man. There was a problem creating the player, this shouldn\'t have happened, sorry!') ;
    }
  }) ;
}
