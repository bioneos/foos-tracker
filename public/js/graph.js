// Verify our namespace
var FoosTracker = FoosTracker || {};

/**
 * Page initialization.
 **/
$(document).on('ready', function(ev) {

  // Common graph setup:
  FoosTracker.graph = new FoosGraph();
  FoosTracker.graph.transitionIn();
  // @zachsanderson says we need to change this for the color blind...
  FoosTracker.palette = d3.scaleOrdinal().range(["#4e9a06", "#057740", "#8ea606", 
    "#84cf3e", "#30a06a", "#c8df43", "#295500", "#004222", "#4e5b00"]);

  // Handle resize events
  $(window).on('resize', function() {
    updateWindowSize();
  });

  // Initialize the popup window
  $('.sidebar').sidebar('setting', 'transition', 'overlay');
  $('.sidebar').sidebar('attach events', '#foos-graph-options', 'show');
  /*$('#foos-graph-options').popup({ 
    'popup': '#game-id-popup',
    'on': 'click', 
    'movePopup': false,
    'setFluidWidth': true,
    'position': 'bottom right' 
  });*/

  // Handle Graph Type selections Clicks
  $('#graph-type .item').on('click', function(ev) {
    // Determine the new graph type
    var newType = $(event.target).attr('id');
    var newGraph = {};
    var data = null;
    if (newType == 'graph-game')
    {
      newGraph = new GameGraph({height: 500, width: $('#foos-graph').width()});
      data = $('#game-id-input').val();
    }
    else if (newType == 'graph-g')
      newGraph = new GoalsGraph({height: 500, width: $('#foos-graph').width()});
    else if (newType == 'graph-got')
      newGraph = new GoalsOverTimeGraph({height: 500, width: $('#foos-graph').width()});
    else if (newType == 'graph-wot')
      newGraph = new WinsOverTimeGraph({height: 500, width: $('#foos-graph').width()});
    else
      return console.log('Error! Couldn\'t find a graph type for "' + newType + '"...');
  
    // Handle Game Id selections
    $('#game-id-selection').on('change', function(ev) {
      FoosTracker.graph.transition($('#game-id-input').val());

      $('.sidebar').sidebar('hide');
    });

    // Handle Date Range update button
    $('#date-range-update').on('click', function(ev) {
      var start = new Date($('#date-range-input-start').val()).getTime();
      var end = new Date($('#date-range-input-end').val()).getTime();
      if (!(start > 0)) start = 0;
      if (!(end > 0)) end = new Date().getTime();
      FoosTracker.graph.transition(start, end);

      $('.sidebar').sidebar('hide');
    });

    // Adjust the menu
    $('#graph-type .item.active').removeClass('active');
    $(event.target).addClass('active');

    // Transition the graphs (in / out)
    FoosTracker.graph.transitionOut(function() {
      FoosTracker.graph = newGraph;
      FoosTracker.graph.transitionIn(data);
    });

    // Adjust the game options button
    $('#foos-graph-options').removeClass('disabled');
  });
  
  // Grab list of recent games, for the Graph Options GameID drop down
  $.get('/games/all', {}, function(data, text, xhr) {
    // Setup the drop-down for GameByTime
    var active = 0;
    data.games.forEach(function(game) {
      active = active || game.id; 

      var when = new Date(Date.parse(game.when));
      var h = when.getHours();
      var m = when.getMinutes() < 10 ? "0" + when.getMinutes() : when.getMinutes();
      var time = (h > 12) ? (h - 12) + ':' + m + 'pm' : h + ':' + m + 'am';
      var date = getDateShortDisplay(when) + ' @ ' + time;
      $('#game-id-selection .menu').append('<div class="item" data-value="' + game.id + '">' + date + '</div>');
    });

    // Initialize the game drop down (and set the most recent game as active)
    $('#game-id-selection .dropdown').dropdown('set selected', active);
  });


  // Handle Graph options button clicks
  $('#foos-graph-options').on('click', function(ev) {
    if (FoosTracker.graph.type() == 'GAME')
    {
      $('#date-range-selection').hide();
      $('#game-id-selection').show();
    }
    else
    {
      $('#date-range-selection').show();
      $('#game-id-selection').hide();
    }
  });
});

/**
 * Window resize handler
 */
function updateWindowSize()
{
  if (FoosTracker.graph.updateWidth) FoosTracker.graph.updateWidth($('#foos-graph').width());
}

/**
 * Utility for date formatting.
 */
function getDateShortDisplay(d)
{
  var date = d.getFullYear() + ' / ' + (d.getMonth() + 1) + ' / ' + d.getDate();
  return date;
}
