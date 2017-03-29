function GoalsOverTimeGraph(config)
{
  // Private variables
  var margin = { top: 10, right: 35, bottom: 20, left: 35 };
  var canvasHeight = config.height - margin.top - margin.bottom; 
  var width = config.width - margin.left - margin.right;
  // Track the currently displayed data (for updateWidth() calls)
  var current = {}; 

  // D3 related objects for Axes
  var xScale = d3.scaleTime().domain([new Date(), undefined]).range([0, width]);
  var yScale = d3.scaleLinear().domain([0, undefined]).range([canvasHeight, 0]);
  var xAxis = d3.axisBottom(xScale);
  var yAxis = d3.axisLeft(yScale).tickFormat(d3.format("d"));
  // D3 Graph render function (step-after line)
  var line = d3.line().curve(d3.curveLinear)
  //var line = d3.line().curve(d3.curveMonotoneX)
    .x(function(d) { return xScale(new Date(d.when)); })
    .y(function(d) { return yScale(d.goals); });

  // Public methods:
  // Our graph type identifier (read only)
  this.type = function() { return 'GoT'; };

  /**
   * Update the width of this graph (window resize events, for example).
   * Pass the value of the container for the graph, and the canvas size
   * will be calculated off of that.
   */
  this.updateWidth = function(newWidth) {
    width = newWidth - margin.left - margin.right;
    xScale.range([0, width]);
    d3.select('svg g.x.axis').call(xAxis);

    // Update data to correct position (Instantaneous)
    var playersData = getPlayersData(current);
    var player = d3.select('svg').selectAll('.player')
      .data(playersData.entries(), function(d) { return d.key; });

    // Line:
    player.select('.line')
      .attr("d", function(d) { return line(d.value); });
    // Nick:
    player.select(".nick")
      .datum(function(d) { return {key: d.key, value: d.value[d.value.length - 1]}; })
      .attr("transform", function(d) { 
        return "translate(" + xScale(new Date(d.value.when)) + "," + yScale(d.value.goals) + ")"; 
      });
  };

  /**
   * Define the way this graph transitions into view.
   */
  this.transitionIn = function(data) {
    // TODO - maybe grow the axis from the bottom left
    // Remove old canvas (If any)  TODO: maybe unnecessary?
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

    // By default display this graph of goals for all time
    this.transition();
  };

  /**
   * Define the way this graph grabs data from the server and transitions
   * into a new state, based on the supplied "data" object 
   * (expecting a date range (in ms), or null for this graph type).
   */
  this.transition = function(start, stop) {
    if (!start) start = 0;
    if (!stop) stop = new Date().getTime();

    $.ajax('/history/games/' + start + "/" + stop, {
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
   * Define the way this graph transitions out of view, then perform the allback
   */
  this.transitionOut = function(callback) {
    updateData({}, callback);
  };


  // Private methods
  /**
   * Private helper for updating the underlying data and D3 objects
   * @param data
   *   The new Goals data, or {}.
   * @param callback
   *   Function to call upon completed transitioning out. Optional.
   */
  function updateData(gamesData, callback)
  {
    // Function constant
    const TRANSITION_DURATION = 1000;
    
    // Ensure empty games list at a minimum
    gamesData.games = gamesData.games || [];

    // Save our current data
    current = gamesData;

    // Obtain our canvas
    var svg = d3.select('#foos-graph svg .canvas');

    // Transform games array into players array
    // TODO  Or on the server API?
    var playersData = getPlayersData(gamesData);
    console.log(playersData);

    // Adjust our scales
    var yMax = d3.max(playersData.entries(), function(d) { return d.value[d.value.length - 1].goals; });
    yScale.domain([0, yMax]);
    var xMax = d3.max(gamesData.games, function(d) { return new Date(d.when); });
    var xMin;
    if (gamesData.games.length > 0) 
      xMin = new Date(gamesData.games[0].when);
    xMax = xMax || new Date();
    xMin = xMin || new Date(xMax);
    xScale.domain([xMin, xMax]);

    // Refresh axes
    svg.select(".y.axis").call(yAxis);
    svg.select(".x.axis").call(xAxis);

    //
    // Data update with transitions
    // TODO: These transitions are a little wonky, especially if adjusting the 
    //   end date and leaving the start date alone.
    //
    // Associate data with all the "player" layers
    var player = svg.selectAll(".player")
      .data(playersData.entries(), function(d) { return d.key; });

    //
    // Update list
    //   This is any Player layer that already existed before we applied
    //   our new data to this visualization
    player.select(".line")
      .transition().duration(TRANSITION_DURATION)
      .attr("d", function(d) { return line(d.value); });
    player.select(".nick")
      .datum(function(d) { return {key: d.key, value: d.value[d.value.length - 1]}; })
      .transition().duration(TRANSITION_DURATION)
      .attr("transform", function(d) { 
        return "translate(" + xScale(new Date(d.value.when)) + "," + yScale(d.value.goals) + ")"; 
      });

    //
    // Enter list
    //   This is any new player that didn't appear in previously applied data.
    var enter = player.enter()
      .append("g")
        .style("stroke", function(d) { return FoosTracker.palette(d.key); })
        .style("fill", function(d) { return FoosTracker.palette(d.key); })
        .attr("class", "player");
    // Entering Player layer: Line
    enter.append("path")
      .attr("class", "line")
      .style("stroke-width", 1.5)
      .style("stroke", function(d) { return FoosTracker.palette(d.key); })
      .attr("d", function(d) {
        return getLineAsPoint(d.value.length, 0, canvasHeight);
      })
      //"M0," + canvasHeight)
    .transition().duration(TRANSITION_DURATION)
      .attr("d", function(d) { return line(d.value); });
    // Entering Player layer: Nickname text
    enter.append("text")
      .datum(function(d) { return {key: d.key, value: d.value[d.value.length - 1]}; })
      .attr("dx", -3)
      .attr("dy", -3)
      .attr("class", "nick")
      .style("fill", "#444")
      .style("stroke-width", 0)
      .style("text-anchor", "end")
      .attr("transform", "translate(0," + canvasHeight + ")")
    .transition().duration(TRANSITION_DURATION)
      .attr("transform", function(d) { 
        return "translate(" + xScale(new Date(d.value.when).getTime()) + "," + yScale(d.value.goals) + ")"; 
      })
      .text(function(d) { return d.key; });

    //
    // Exit list
    //   This is any player that previously exited, but didn't appear in the
    //   currently applied dataset.
    var exit = player.exit();
    exit.selectAll(".line")
      .transition().duration(TRANSITION_DURATION)
        .attr("d", function(d) { 
          return getLineAsPoint(d.value.length, 0, canvasHeight);
          /*
          //console.log("Exit data: ", d);
          var line = "M0," + canvasHeight;
          for (i = 1; i < d.value.length; i++)
            line += "H0V" + canvasHeight;
          //console.log(line);
          return line;*/
        })
      .remove();
    // Exiting Player layer: Nickname text
    exit.selectAll(".nick")
      .transition().duration(TRANSITION_DURATION)
        .attr("transform", "translate(0, " + canvasHeight + ")")
      .remove();
    // At the end of the transition, remove the player layer entirely
    exit.transition().duration(TRANSITION_DURATION).remove();


    //
    // Now handle our transition completion callback
    // NOTE: Because of the many queued, simultaneous transitions, I have
    // implemented what feels like a hacky solution to this problem. Rather
    // than count the number of nodes in my selection and handle the 'end'
    // event for each, only calling the callback at the end 
    //   (as suggested by Mike Bostock here:)
    //   https://groups.google.com/forum/#!msg/d3-js/WC_7Xi6VV50/j1HK0vIWI-EJ
    // Instead, I am queuing all of the transitions with the same duration,
    // and at the end, creating a single transition of the SVG with the same
    // duration, The assumption is, this transition is queued last and always
    // performed on a single node. Therefore, it can safely call my callback...
    if (callback)
    {
      // TODO: We probably want to review this for better solutions in the future
      d3.select('svg').transition().duration(TRANSITION_DURATION)
        .on('interrupt end', function() { callback(); });
    }
  }

  /**
   * Private function to transform the Games Data array into a Players Data.
   */
  function getPlayersData(gamesData)
  {
    var playersData = d3.map();
    gamesData.games.forEach(function(game) {
      d3.keys(game.goals).forEach(function (nick) {
        var total = 0;
        if (!playersData.has(nick)) 
          playersData.set(nick, []);
        else
          total = playersData.get(nick)[playersData.get(nick).length - 1].goals || 0;
        playersData.get(nick).push({ when: game.when, goals: total + game.goals[nick]});
      });
    });

    return playersData;
  }

  /**
   * Private function to generate the SVG "d" representation of a line as a 
   * point with the specified number of segments, originated at the specified
   * x/y coords.
   */
  function getLineAsPoint(segments, x, y)
  {
    var pline = "M" + x + "," + y;
    for (var num = 1; num < segments; num++)
      pline += "L" + x + "," + y;
    return pline;
  }
}
