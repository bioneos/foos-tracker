// Verify our namespace
var FoosTracker = FoosTracker || {};
// Define our encapsulation
function RecentGames(gameData) {
  var gutter = 10;
  var margin = {top: 5, right: 10, bottom: 15, left: 10};
  var tabletBreak = 768;

  var width = window.innerWidth;
  var canvasWidth = $("#recent-games").width();
  var canvasHeight = $("#recent-games").height();
  //var canvasHeight = (width >= tabletBreak) ? 2 * height : height;
  var divisor = (width >= tabletBreak) ? 4 : 2;
  var rows = (width >= tabletBreak) ? 1 : 2;
  var gWidth = Math.floor((canvasWidth - (gutter * (divisor - 1))) / divisor) - 1;
  var gHeight = ((canvasHeight - margin.top - margin.bottom) / rows) - ((rows - 1) * gutter);


  // Setup graphs of the last 4 games as follows:
  //   1) 4 X-Scales based on game players, ensure order follows Leaderboard order (TODO)
  //   2) 4 X-Axes for rendering the different scales
  //   3) 1 Y-Scale maxed at the largest threshold of the 4 games
  //   4) Last game on top-left (index 0)
  //   5) TODO: Never display more than 5 players??  (would be crowded, how to handle this better?)
  var xScale = []
  xScale[0] = d3.scaleBand().domain(gameData.games[0].goals).range([0, gWidth]);
  var xAxis = [];
  xAxis[0] = d3.axisBottom(xScale[0]).tickFormat('').tickSizeOuter(3).tickSizeInner(7);

  // Transition in
  d3.select('svg#recent-games').append('g')
    .attr('class', 'x-axis')
    .attr('id', 'graph-0');
  d3.select('svg#recent-games').append('g')
    .attr('class', 'x-axis')
    .attr('id', 'graph-1');
  d3.select('svg#recent-games').append('g')
    .attr('class', 'x-axis')
    .attr('id', 'graph-2');
  d3.select('svg#recent-games').append('g')
    .attr('class', 'x-axis')
    .attr('id', 'graph-3');
  xAxis.forEach(function(axis, index) {
    var x = ((gWidth + gutter) * (index % divisor));
    var y = ((gHeight * (Math.floor(index / divisor) + 1)));
    d3.select('svg#recent-games g#graph-' + index + '.x-axis')
      .attr('transform', 'translate(' + x + ',' + y + ')')
      .call(axis);
  });


  /**
   * Handle window size update events.
   */
  this.updateWindowSize = function() { 
    width = window.innerWidth;
    canvasWidth = $('svg#recent-games').width();
    canvasHeight = $("#recent-games").height();
    //canvasHeight = (width >= tabletBreak) ? 2 * height : height;
    divisor = (width >= tabletBreak) ? 4 : 2;
    
    gWidth = Math.floor((canvasWidth - (gutter * (divisor - 1))) / divisor) - 1;
    
    xScale.range([0, gWidth]);
    xAxis.forEach(function(axis, index) {
      var x = ((gWidth + gutter) * (index % divisor));
      // TODO: handle row correctly
      var y = ((gHeight * (Math.floor(index / divisor) + 1)));

      d3.select('svg#recent-games g#graph-' + index + '.x-axis')
        .attr('transform', 'translate(' + x + ',' + y + ')')
        .call(axis);
    });
  }
}


/**
 * Page initialization.
 **/
$(document).on('ready', function(ev) {
  // Get data for the last 4 games
  $.get('/api/games/last/4', function(gameData, text, xhr) {
    // TODO: initialize recent Games first before this call
    FoosTracker.recent = new RecentGames(gameData);

    // Bind window resize events
    $(window).on('resize', FoosTracker.recent.updateWindowSize);
  });
});
