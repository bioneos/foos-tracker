/**
 * THIS IS ONLY AN EXAMPLE PLACEHOLDER
 *   use a separate file to define your specific graph type
 *
 * Define our FoosGraph class to support /time and /day graphs, resizing, and
 * transitioning between data or graph types.
 *
 * Parasitic inheritance?
 *   http://www.breck-mckye.com/blog/2014/05/why-i-prefer-parasitic-inheritance/
 * Testing out if we can maintain Object typing through "var graph = this"
 */
function FoosGraph() 
{
  // [Goals, Goals over Time, W over Time, Emb over Time, Game Length, Emb per Game Length]
  // [G, GoT, WoT, WoT, GL, WoGL, EoGL]
  /* Public Variables:
  this.type = function() { return 'none' };  
  this.xScale = d3.time.scale();
  this.yScale = d3.scale().linear();
  this.xAxis = d3.svg.axis();
  this.yAxis = d3.svg.axis();
  this.width = 500; // Current width of the SVG
  this.current = 0; // GameId or DateRange
  this.transitionIn = function(data) {};
  this.transition = function(data) {};
  this.transitionOut = function(callback) {};
  */
  var graph = this;
  graph.type = '';
  graph.margin = { top: 20, right: 50, bottom: 20, left: 50 };
  graph.xScale = d3.scaleTime().domain([new Date(), new Date()]).range([0, width]);
  return graph;
}


