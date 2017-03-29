function GoalsGraph(config)
{
  // Private variables
  const margin = { top: 15, right: 15, bottom: 15, left: 15 };
  const padding = 10;
  var canvasHeight = config.height - margin.top - margin.bottom; 
  var width = config.width - margin.left - margin.right;
  // Track the currently displayed data (for updateWidth() calls)
  var current = {}; 

  // Radius measurement
  var radius = Math.min(width, canvasHeight) / 2;
  // D3 Graph render functions (arc / pie)
  var arc = d3.arc().outerRadius(radius - 10).innerRadius(0);
  var textarc = d3.arc().outerRadius(radius - 10).innerRadius((radius - 10) / 3);
  var pie = d3.pie()
    .value(function(d) { return d.value; });

  // Public methods:
  // Our graph type identifier (read only)
  this.type = function() { return 'G'; };

  /**
   * Update the width of this graph (window resize events, for example).
   * Pass the value of the container for the graph, and the canvas size
   * will be calculated off of that.
   */
  this.updateWidth = function(newWidth) {
    width = newWidth - margin.left - margin.right;
    radius = Math.min(width, canvasHeight) / 2;
    arc = d3.arc().outerRadius(radius - 10).innerRadius(0);
    textarc = d3.arc().outerRadius(radius - 10).innerRadius((radius - 10) / 3);
    // Maybe update height too?
    
    // Update transform on graph canvas
    d3.select('.canvas')
      .attr('transform', 'translate(' + (width / 2) + ', ' + (canvasHeight / 2) + ')');

    // Update data to correct positions (Instantaneous)
    // We cannot use a transition into this as the event has to be processed
    // very quickly, but luckily we just need to apply the new data really.
    var playersData = getPlayersData(current);
    var player = d3.select('svg').selectAll('.player')
      .data(pie(playersData.entries()), function(d) { return d.data.key; });

    // Arc:
    player.select(".arc")
      .datum(function(d) { return d; })
      .attr("d", arc);

    // Nick:
    player.select(".nick")
      .datum(function(d) { return d; })
      .attr("transform", function(d) { return "translate(" + textarc.centroid(d) + ")"; })
      .text(function(d) { return d.data.key; });
    // Goals:
    player.select(".goals")
      .datum(function(d) { return d; })
      .attr("transform", function(d) { return "translate(" + textarc.centroid(d) + ")"; })
      .text(function(d) { return d.data.value; });
  };

  /**
   * Define the way this graph transitions into view.
   */
  this.transitionIn = function(data) {
    // Remove old canvas (If any)  TODO: maybe unnecessary?
    d3.select('#foos-graph svg g.canvas').remove();
    // Add our canvas
    var canvas = d3.select('#foos-graph svg').append('g')
      .attr('class', 'canvas')
      .attr('transform', 'translate(' + (width / 2) + ', ' + (canvasHeight / 2) + ')');

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
    //
    // Data update with transitions
    //
    // Associate data with all the "player" layers
    var player = svg.selectAll(".player")
      .data(pie(playersData.entries()), function(d) { return d.data.key; });
    
    //
    // Update list
    //   This is any Player layer that already existed before we applied
    //   our new data to this visualization
    player.select(".arc")
    .transition().duration(TRANSITION_DURATION)
      .attrTween('d', arcTween)
    player.select(".nick")
      .datum(function(d) { return d; })
    .transition().duration(TRANSITION_DURATION)
      .attr("transform", function(d) { return "translate(" + textarc.centroid(d) + ")"; })
      .text(function(d) { return d.data.key; });
    player.select(".goals")
      .datum(function(d) { return d; })
    .transition().duration(TRANSITION_DURATION)
      .attr("transform", function(d) { return "translate(" + textarc.centroid(d) + ")"; })
      .text(function(d) { return d.data.value; });


    //
    // Enter list
    //   This is any new player that didn't appear in previously applied data.
    var enter = player.enter()
      .append("g")
        .attr("class", "player");
    // Entering Player layer: pie arc
    enter.append("path")
      .attr("class", "arc")
      .style("fill", function(d) { return FoosTracker.palette(d.data.key); })
      // Start each entering arc at a start/end angle of 0*
      .each(function(d) { this._current = {startAngle:0, endAngle: 0}; })
    .transition().duration(TRANSITION_DURATION)
      .attrTween('d', arcTween)
    // Entering Player layer: Nickname text
    enter.append("text")
      .datum(function(d) { return d; })
      .attr("class", "nick")
      .style("fill", "#222")
      .style("font-weight", "bold")
      .style("stroke-width", 0)
      .style("text-anchor", "middle")
      .attr("transform", "translate(0,0)")
    .transition().duration(TRANSITION_DURATION)
      .attr("transform", function(d) { return "translate(" + textarc.centroid(d) + ")"; })
      .text(function(d) { return d.data.key; });
    enter.append("text")
      .datum(function(d) { return d; })
      .attr("dy", "1.1em")
      .attr("class", "goals")
      .style("fill", "#222")
      .style("font-weight", "bold")
      .style("stroke-width", 0)
      .style("text-anchor", "middle")
      .attr("transform", "translate(0,0)")
    .transition().duration(TRANSITION_DURATION)
      .attr("transform", function(d) { return "translate(" + textarc.centroid(d) + ")"; })
      .text(function(d) { return d.data.value; });

    //
    // Exit list
    //   This is any player that previously exited, but didn't appear in the
    //   currently applied dataset.
    var exit = player.exit();
    // Transition all arcs to 0 angle
    exit.selectAll(".arc")
      .datum({ startAngle: 0, endAngle: 0 })
      .transition().duration(TRANSITION_DURATION)
        .attrTween('d', arcTween)
      .remove();
    exit.selectAll(".nick")
    // Exiting Player layer: Nickname text
    exit.selectAll(".nick")
      .transition().duration(TRANSITION_DURATION)
        .attr("transform", "translate(0, 0)")
      .remove();
    exit.selectAll(".goals")
      .transition().duration(TRANSITION_DURATION)
        .attr("transform", "translate(0, 0)")
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
   *   Simple Map:
   *   {
   *     'Player Nick': <num_goals>
   *   }
   */
  function getPlayersData(gamesData)
  {
    var playersData = d3.map();
    gamesData.games.forEach(function(game) {
      d3.keys(game.goals).forEach(function (nick) {
        var total = 0;
        if (!playersData.has(nick)) 
          playersData.set(nick, 0);
        playersData.set(nick, playersData.get(nick) + game.goals[nick]);
      });
    });

    return playersData;
  }

  /**
   * Custom arc tween method, since the defaults cannot handle arcs > 180*.
   * See discussion here, and detailed example underneath:
   *   http://stackoverflow.com/questions/21285385/d3-pie-chart-arc-is-invisible-in-transition-to-180%C2%B0
   *   http://bl.ocks.org/mbostock/1346410
   */
  // Store the displayed angles in _current.
  // Then, interpolate from _current to the new angles.
  // During the transition, _current is updated in-place by d3.interpolate.
  function arcTween(a)
  {
    this._current = this._current || a;
    var i = d3.interpolate(this._current, a);
    this._current = i(0);
    return function(t) {
      return arc(i(t));
    };
  }
}
