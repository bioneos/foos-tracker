function GoalsGraph()
{
  // Private variables
  var margin = { top: 20, right: 50, bottom: 20, left: 50 };
  // TEMP / TODO Can we encapsulate this? Or maybe just calculate off of a known
  var canvasHeight = 600 - margin.top - margin.bottom; 
  var width = $('#foos-graph').width() - margin.left - margin.right;
  
  // GameId (starts with no game selected)
  var current = 0; 

  // Our graph type identifier (read only)
  this.type = function() { return 'G'; };
  // Other public variables TODO might try to make these private)
  var xScale = d3.scaleTime().domain([new Date(), new Date()]).range([0, width]);
  var yScale = d3.scaleLinear().domain([0, 10]).range([canvasHeight, 0]);
  var xAxis = d3.axisBottom(xScale)
    .tickFormat(d3.timeFormat("%_I:%M%p"));
  var yAxis = d3.axisLeft(yScale).ticks(6)
    .tickFormat(d3.format("d"));

  // Graph render function (step-after line)
  var line = d3.line().curve(d3.curveStepAfter)
    .x(function(d) { return xScale(new Date(d.when).getTime()) })
    .y(function(d) { return yScale(d.num) });


  // Public methods:
  /**
   * Update the width of this graph (window resize events, for example).
   * Pass the value of the container for the graph, and the canvas size
   * will be calculated off of that.
   */
  this.updateWidth = function(newWidth) {
    width = newWidth - margin.left - margin.right;
    self.xScale.range([0, width]);
    d3.select('g.x.axis').call(self.xAxis);
  };

  /**
   * Define the way this graph transitions into view.
   */
  this.transitionIn = function(data) {
    console.log('Will transition into view'); 
    // TODO - maybe grow the axis from the bottom left

    // Remove old canvas (If any)
    d3.select('#foos-graph svg g.canvas').remove();
    // Add our canvas
    var canvas = d3.select('#foos-graph svg').append('g')
      .attr('class', 'canvas')
      .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

    // Setup the initial graph axes
    canvas.append("g")
      .attr("class", "y axis")
      .call(yAxis);
    canvas.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0, " + canvasHeight + ")")
      .call(xAxis);

    // If data is supplied, transition in the data now (expecting a game id)
    if (data) this.transition(data);
  };

  /**
   * Define the way this graph grabs data from the server and transitions
   * into a new state, based on the supplied "data" object (expecting
   * a GameID for this graph type).
   */
  this.transition = function(gameId) {
    console.log('Will transition to new GameID: ', gameId);
    if (!gameId || gameId < 0) return updateData({});

    $.ajax('/history/game/' + gameId, {
      dataType: 'json',
      success: function(data, text, jqxhr) {
        updateData(data);
      },
      error: function(jqxhr, text, error) {
        // TODO: maybe setup image and color in case this is a warning?
        updateData({});
        $('.ui.modal .description').empty();
        $('.ui.modal .description').append("<p>" + jqxhr.responseJSON.error + "</p>");
        $('.ui.modal').modal('show');
      }
    });
  };

  /**
   * Define the way this graph transitions out of view, then assign the
   * global to our new FoosGraph, and call its transitionIn method.
   */
  this.transitionOut = function(newGraph) {
    console.log('Will transition out of view'); // TODO
    updateData({});
    FoosTracker.graph = newGraph;
    FoosTracker.graph.transitionIn(10);
  };


  // Private methods
  /**
   * Private helper for updating the underlying data and D3 objects
   * @param data
   *   The new GameDay data, or {}.
   */
  function updateData(gameData)
  {
    // First create a game skeleton, if passed an empty object.
    if (!gameData.when)
    {
      gameData.when = new Date();
      gameData.threshold = 5;
      gameData.goals = {};
    }
    
    // Obtain our canvas
    var svg = d3.select('#foos-graph svg .canvas');

    // Adjust our scales
    yScale.domain([0, gameData.threshold]);
    xMax = new Date(gameData.when);
    d3.map(gameData.goals).each(function(goals, nick) {
      playerMax = d3.max(goals, function(d) { return new Date(d.when); });
      xMax = d3.max([xMax, playerMax]);
    });
    xScale.domain([new Date(gameData.when).getTime(), xMax.getTime()]);
    FoosTracker.palette.domain(d3.keys(gameData.goals));

    // Refresh axes
    svg.select(".y.axis").call(yAxis);
    svg.select(".x.axis").call(xAxis);

    //
    // Data update with transitions
    //
    // Update list (adjust existing data to correct NEW locations)
    var player = svg.selectAll(".player")
      .data(d3.entries(gameData.goals), function(d) { return d.key; });
    player.select(".line").transition().duration(1000)
      .attr("d", function(d) { 
        console.log("OLD Data: ", d3.select(this).attr("d"));
        console.log("NEW: ", line(d.value)); 
        return line(d.value); });
    player.select(".nick")
      .datum(function(d) { return {key: d.key, value: d.value[d.value.length - 1]}; })
      .transition().duration(1000)
      .attr("transform", function(d) { 
        return "translate(" + xScale(new Date(d.value.when)) + "," + yScale(d.value.num) + ")"; 
      });

    // Enter list
    var enter = player.enter()
      .append("g")
        .style("stroke", function(d) { return FoosTracker.palette(d.key); })
        .attr("class", "player");
    enter.append("path")
      .attr("class", "line")
      .style("stroke", function(d) { return FoosTracker.palette(d.key); })
      // TODO: Make this out of the threshold (# L segments == number of goals)
      .attr("d", "M0," + canvasHeight + 
        "L0," + canvasHeight + 
        "L0," + canvasHeight + 
        "L0," + canvasHeight + 
        "L0," + canvasHeight + 
        "L0," + canvasHeight + 
        "L0," + canvasHeight + 
        "L0," + canvasHeight + 
        "L0," + canvasHeight + 
        "L0," + canvasHeight + 
        "L0," + canvasHeight)
    .transition().duration(1000)
      .attr("d", function(d) { console.log('data', d.value, line(d.value)); return line(d.value); })
      .style("stroke-width", 1.5);
    // Line points:
    enter.selectAll("circle")
      .data(function(d) { return d.value; }).enter()
      .append("circle")
        .attr("class", "line-point")
        .attr("r", 3.5)
        .attr("cx", 0).attr("cy", canvasHeight)
      .transition().duration(1000)
        .attr("cx", function(d) { return xScale(new Date(d.when).getTime()); })
        .attr("cy", function(d) { return yScale(d.num); });
    // Nickname text:
    enter.append("text")
      .datum(function(d) { return {key: d.key, value: d.value[d.value.length - 1]}; })
      .style("stroke-width", 0)
      .style("fill", "none")
      .attr("dx", 7)
      .attr("transform", "translate(0," + canvasHeight + ")")
    .transition().duration(1000)
      .attr("transform", function(d) { 
        return "translate(" + xScale(new Date(d.value.when).getTime()) + "," + yScale(d.value.num) + ")"; 
      })
      .attr("class", "nick")
      .style("stroke-width", 0)
      .style("fill", "#444")
      .text(function(d) { return d.key; })

    // Exit list
    var exit = player.exit();
    exit.selectAll("circle")
      .transition().duration(1000)
        .attr("cx", 0)
        .attr("cy", canvasHeight)
      .remove();
    exit.selectAll(".line")
      .transition().duration(1000)
      // TODO: This has to have the correct number of segments! (need a method for this):
        .attr("d", function(d) { 
          //console.log("Exit data: ", d);
          var line = "M0," + canvasHeight;
          for (i = 1; i < d.value.length; i++)
            line += "H0V" + canvasHeight;
          //console.log(line);
          return line;
        })
      .remove();
    exit.selectAll(".nick")
      .transition().duration(1000)
        .attr("cx", 0).attr("cy", canvasHeight)
      .remove();
    // At the end of the transition, remove the player layer entirely
    exit.transition().duration(1000).remove();


    // 
    // Now apply data to circles separately
    //
    var circles = player.selectAll("circle")
      .data(function(d) { return d.value; });
    // Existing data
    circles.transition().duration(1000)
        .attr("cx", function(d) { return xScale(new Date(d.when).getTime()); })
        .attr("cy", function(d) { return yScale(d.num); });
    // New data
    circles.enter()
      .append("circle")
      .attr("class", "line-point").attr("r", 3.5).attr("cx", 0).attr("cy", canvasHeight)
    .transition().duration(1000)
      .attr("cx", function(d) { return xScale(new Date(d.when).getTime()); })
      .attr("cy", function(d) { return yScale(d.num); });
    // Removed data
    circles.exit().transition().duration(1000)
      //.each('interrupt end', function() { console.log('transition ended'); })
      .on('interrupt end', function() { console.log('transition ended'); })
      .attr("cx", 0).attr("cy", canvasHeight)
      .remove();
  }
}
