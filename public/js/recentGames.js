// Verify our namespace
var FoosTracker = FoosTracker || {};
// Define our encapsulation
function RecentGames(config) {
  var gutter = 10;
  var height = 150;
  var margin = {top: 5, right: 10, bottom: 15, left: 10};
  var tabletBreak = 768; 

  var width = window.innerWidth;
  var canvasWidth = $("#recent-games").width();
  var canvasHeight = (width >= tabletBreak) ? 2 * height : height;
  var divisor = (width >= tabletBreak) ? 4 : 2;
  var gWidth = Math.floor((canvasWidth - (gutter * (divisor - 1))) / divisor) - 1;

  var xScale = d3.scaleBand().domain(['1st', '2nd', '3rd']).range([0, gWidth]);
  var xAxis = [];
  xAxis[0] = d3.axisBottom(xScale).tickFormat('').tickSizeOuter(3).tickSizeInner(7);
  xAxis[1] = d3.axisBottom(xScale).tickFormat('').tickSizeOuter(3).tickSizeInner(7);
  xAxis[2] = d3.axisBottom(xScale).tickFormat('').tickSizeOuter(3).tickSizeInner(7);
  xAxis[3] = d3.axisBottom(xScale).tickFormat('').tickSizeOuter(3).tickSizeInner(7);

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
    var y = ((height * (Math.floor(index / divisor) + 1)) - margin.bottom);

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
    canvasHeight = (width >= tabletBreak) ? 2 * height : height;
    divisor = (width >= tabletBreak) ? 4 : 2;
    
    gWidth = Math.floor((canvasWidth - (gutter * (divisor - 1))) / divisor) - 1;
    
    xScale.range([0, gWidth]);
    xAxis.forEach(function(axis, index) {
      var x = ((gWidth + gutter) * (index % divisor));
      var y = ((height * (Math.floor(index / divisor) + 1)) - margin.bottom);

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
  FoosTracker.recent = new RecentGames({});

  // Bind window resize events
  $(window).on('resize', FoosTracker.recent.updateWindowSize);
});
