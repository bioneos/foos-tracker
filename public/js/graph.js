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
  $('#foos-graph-options').popup({ 'on': 'click' });

  // Handle Graph Type selections Clicks
  $('#graph-type .item').on('click', function(ev) {
    // Determine the new graph type
    var newType = $(event.target).attr('id');
    var newGraph = {};
    if (newType == 'graph-g')
      newGraph = new GoalsGraph({height: 500, width: $('#foos-graph').width()});
    else if (newType == 'graph-got')
      newGraph = new GoalsOverTimeGraph({height: 500, width: $('#foos-graph').width()});
    else if (newType == 'graph-wot')
      newGraph = new WinsOverTimeGraph({height: 500, width: $('#foos-graph').width()});
    else
      return console.log('Error! Couldn\'t find a graph type for "' + newType + '"...');

    // Adjust the menu
    $('#graph-type .item.active').removeClass('active');
    $(event.target).addClass('active');

    // Transition the graphs (in / out)
    FoosTracker.graph.transitionOut(function() {
      FoosTracker.graph = newGraph;
      //FoosTracker.graph.transitionIn(Math.floor((Math.random() * 10) + 10));  // TEMP
      FoosTracker.graph.transitionIn();
    });

    // Adjust the game options button
    $('#foos-graph-options').text('Graph Options').removeClass('disabled');
  });

  // Initialize the game drop down (TODO get IDs)
  $('#game-id-selection .dropdown').dropdown();

  // Handle Graph options button clicks
  $('#foos-graph-options').on('click', function(ev) {
    if (FoosTracker.graph.type() == 'G')
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
