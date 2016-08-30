/**
 * THIS IS ONLY AN EXAMPLE PLACEHOLDER GRAPH
 *   use a separate file to define your specific graph type
 *
 * Define our FoosGraph class to support /time and /day graphs, resizing, and
 * transitioning between data or graph types. We will rely on duck typing, so
 * be sure to define the minimum expected public methods listed below:
 */
function FoosGraph() 
{
  //
  // Expected Public Methods:
  //
  // Current graph type possibilities
  // [Goals, Goals over Time, W over Time, Emb over Time, Game Length, Emb per Game Length]
  // [G, GoT, WoT, WoT, GL, WoGL, EoGL]
  this.type = function() { return 'placeholder' };
  this.updateWidth = function(newWidth) {
    // Do nothing 
    // (our placeholder is defined as a relatively positioned element)
  };
  this.transitionIn = function(data) {
    // Instantaneously apply our placeholder text
    d3.select('#foos-graph svg')
      .append('g').attr('class', 'canvas')
        .append('text')
          .attr('id', 'placeholder')
          .attr('x', '50%').attr('y', '45%')
          .attr('style', 'text-anchor: middle; font-size: 3em;')
          .text('Select Graph Type');
  };
  this.transition = function(data) {
    // Do nothing
  };
  this.transitionOut = function(callback) {
    // Remove our placeholder from the canvas
    d3.select('#foos-graph svg g #placeholder').remove();
    callback();
  };
}


