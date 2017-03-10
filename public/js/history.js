// Global namespace for caching some of the configured d3 settings
var viz = {};
// Cached game history for the homepage (stores the previous week's data)
var gameHistory = {};

/**
 * Initialize the History page and all controls.
 */
function initHistoryPage()
{
  $.get('/games/all', {}, function(data, text, xhr) {
    // Setup the drop-down for GameByTime
    data.games.forEach(function(game) {
      var when = new Date(Date.parse(game.when));
      var h = when.getHours();
      var m = when.getMinutes() < 10 ? "0" + when.getMinutes() : when.getMinutes();
      var time = (h > 12) ? (h - 12) + ':' + m + 'pm' : h + ':' + m + 'am';
      var date = getDateShortDisplay(when) + ' @ ' + time;
      $('#game-goals-by-time').append('<option value=' + game.id + '>' + date + '</option>');
    });
    
    // Setup our D3 graph and settings
    setupGoalsByTime("#history-graph");

    // Setup the dropdown behavior for SemanticUI, and our events
    $('.ui.dropdown').dropdown();
    $('#game-goals-by-time').on('change', changeGameGoalsByTime);

    // Handle resize events
    $(window).on('resize', function() {
      updateWindow("#history-graph");
    });
  });
}

/**
 * Setup viz for the history page
 */
function setupGoalsByTime(container)
{
  viz.bytime = {};
  viz.bytime.margin = { top: 20, right: 50, bottom: 20, left: 50 };
  viz.bytime.height = 500;
  viz.bytime.width = $(container).width() - viz.bytime.margin.left - viz.bytime.margin.right;

  // TODO: If not splitting this code to homepage / history, some of the
  //   common setup for the "viz" object should be in a separate method...
  // Define our palette
  viz.color = d3.scale.ordinal().range(["#4e9a06", "#057740", "#8ea606", 
    "#84cf3e", "#30a06a", "#c8df43",
    "#295500", "#004222", "#4e5b00"]);
  viz.bytime.x = d3.time.scale().range([0, viz.bytime.width])
    .domain([new Date(), new Date()]);
  viz.bytime.y = d3.scale.linear().range([viz.bytime.height, 0])
    .domain([0, 5]);
  // The line generation function
  viz.bytime.line = d3.svg.line()
    .interpolate("step-after")
    //.interpolate("linear")
    //.interpolate("monotone")
    //.interpolate("bundle").tension(.8)
    //.interpolate("cardinal").tension(.8)
    .x(function(d) { return viz.bytime.x(new Date(d.when)); })
    .y(function(d) { return viz.bytime.y(d.num); });

  viz.bytime.xAxis = d3.svg.axis()
    .scale(viz.bytime.x)
    .tickFormat(d3.time.format("%_I:%M%p"))
    .orient("bottom");
  viz.bytime.yAxis = d3.svg.axis()
    .scale(viz.bytime.y)
    .tickFormat(d3.format("d"))
    .orient("left");

  // Setup the SVG object (one time)
  var svg = d3.select("#history-graph").append("svg")
    .attr("width", $(container).width())
    .attr("height", viz.bytime.height + viz.bytime.margin.top + viz.bytime.margin.bottom)
  .append("g")
    .attr('class', 'canvas')
    .attr("transform", "translate(" + viz.bytime.margin.left + ", " + viz.bytime.margin.top + ")");

  // Setup the initial graph axes
  svg.append("g")
    .attr("class", "y axis")
    .call(viz.bytime.yAxis);
  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0, " + viz.bytime.height + ")")
    .call(viz.bytime.xAxis);

/*
  // TEMP: (TODO: support this format)
  var data = {
    "Davis": [
      {num:0, when:"2015-11-11T16:40:11.949Z"},
      {num:1, when:"2015-11-11T16:42:11.949Z"},
      {num:2, when:"2015-11-11T16:42:19.390Z"},
      {num:3, when:"2015-11-11T16:43:18.390Z"},
      {num:4, when:"2015-11-11T16:52:12.390Z"},
      {num:5, when:"2015-11-11T16:54:02.390Z"}
    ],
    "Smees": [
      {num:0, when:"2015-11-11T16:40:11.949Z"},
      {num:1, when:"2015-11-11T16:48:12.390Z"}
    ]
  };
  var data2 = {
    "Davis": [
      {num:0, when:"2015-11-10T16:40:21.949Z"},
      {num:1, when:"2015-11-10T16:42:21.949Z"},
      {num:2, when:"2015-11-10T16:42:39.390Z"},
      {num:3, when:"2015-11-10T16:43:08.390Z"},
      {num:4, when:"2015-11-10T16:46:02.390Z"}
    ],
    "Smees2": [
      {num:0, when:"2015-11-10T16:40:11.949Z"},
      {num:1, when:"2015-11-10T16:48:12.390Z"},
      {num:2, when:"2015-11-10T16:49:12.390Z"},
      {num:3, when:"2015-11-10T16:50:12.390Z"},
      {num:4, when:"2015-11-10T16:51:12.390Z"},
      {num:5, when:"2015-11-10T16:52:12.390Z"}
    ],
    "Michael": [
      {num:0, when:"2015-11-10T16:40:11.949Z"},
      {num:1, when:"2015-11-10T16:46:12.390Z"}
    ]
  };
  temp = new Date("2015-11-11T16:40:11.949Z");
  xMax = temp;
  d3.map(data).forEach(function(nick, goals) {
    playerMax = d3.max(goals, function(d) { return new Date(d.when); });
    xMax = d3.max([xMax, playerMax]);
  });
  x.domain([temp, xMax]);
  viz.color.domain(d3.keys(data));


  // And our line graphs
  var player = svg.selectAll(".player")
    .data(d3.entries(data), function(d) { return d.key; })
    .enter()
    .append("g")
      .style("stroke", function(d) { return viz.color(d.key); })
      .attr("class", "player");
  player.append("path")
    .attr("class", "line")
    .attr("d", function(d) { return viz.line(d.value); })
    .style("stroke", function(d) { return viz.color(d.key); });
  player.selectAll("circle")
    .data(function(d) { return d.value; }).enter()
    .append("circle")
      .attr("class", "line-point")
      .attr("cx", function(d) { return x(new Date(d.when)); })
      .attr("cy", function(d) { return y(d.num); })
      .attr("r", 3.5);
  player.append("text")
    .datum(function(d) { return {key: d.key, value: d.value[d.value.length - 1]}; })
    .attr("transform", function(d) { return "translate(" + x(new Date(d.value.when)) + "," + y(d.value.num) + ")"; })
    .attr("dx", 7)
    .attr("class", "nick")
    .style("stroke-width", 0)
    //.style("fill", function(d) { return viz.color(d.key); })
    .style("fill", "#444")
    .text(function(d) { return d.key; })
  window.setTimeout(function() {
    y.domain([0,6]);
    temp = new Date("2015-11-10T16:40:11.949Z");
    xMax = temp;
    d3.map(data2).forEach(function(nick, goals) {
      playerMax = d3.max(goals, function(d) { return new Date(d.when); });
      xMax = d3.max([xMax, playerMax]);
    });
    x.domain([temp, xMax]);
    viz.color.domain(d3.keys(data2));
    svg.select(".y.axis").call(yAxis);
    svg.select(".x.axis").call(xAxis);
    var test = svg.selectAll(".player").data(d3.entries(data2), function(d) { return d.key; });

    test.select(".line").transition().duration(1000)
      .attr("d", function(d) { return viz.line(d.value); });
    var circles = test.selectAll("circle")
      .data(function(d) { return d.value; });
    // Old data
    circles.transition().duration(1000)
        .attr("cx", function(d) { return x(new Date(d.when)); })
        .attr("cy", function(d) { return y(d.num); });
    // New data
    circles.enter()
      .append("circle")
      .attr("class", "line-point").attr("r", 3.5).attr("cx", 0).attr("cy", height)
    .transition().duration(1000)
      .attr("cx", function(d) { return x(new Date(d.when)); })
      .attr("cy", function(d) { return y(d.num); });
    // Removed data
    circles.exit().transition().duration(1000)
      .attr("cx", 0).attr("cy", height)
      .remove();
    test.select(".nick")
      .datum(function(d) { return {key: d.key, value: d.value[d.value.length - 1]}; })
      .transition().duration(1000)
      .attr("transform", function(d) { return "translate(" + x(new Date(d.value.when)) + "," + y(d.value.num) + ")"; });

    // Add players
    var player = test.enter()
      .append("g")
        .style("stroke", function(d) { return viz.color(d.key); })
        .attr("class", "player");
    player.append("path")
      .attr("class", "line")
      .style("stroke", function(d) { return viz.color(d.key); })
 //     .style("stroke-width", 0)
      // TODO: Make this out of the threshold (# segments == threshold
      .attr("d", "M0," + height + "L0," + height + "L0," + height + "L0," + height + "L0," + height + "L0," + height)
    .transition().duration(1000)
//      .attr("d", "M0," + height + "L1000," + (height - 100))
      .attr("d", function(d) { return viz.line(d.value); })
      .style("stroke-width", 1.5);
    player.selectAll("circle")
      .data(function(d) { return d.value; }).enter()
      .append("circle")
        .attr("class", "line-point")
        .attr("r", 3.5)
        .attr("cx", 0).attr("cy", height)
      .transition().duration(1000)
        .attr("cx", function(d) { return x(new Date(d.when)); })
        .attr("cy", function(d) { return y(d.num); });
    player.append("text")
      .datum(function(d) { return {key: d.key, value: d.value[d.value.length - 1]}; })
      .style("stroke-width", 0)
      //.style("fill", function(d) { return viz.color(d.key); })
      .style("fill", "none")
      .attr("dx", 7)
      .attr("transform", "translate(0," + height + ")")
    .transition().duration(1000)
      .attr("transform", function(d) { return "translate(" + x(new Date(d.value.when)) + "," + y(d.value.num) + ")"; })
      .attr("class", "nick")
      .style("stroke-width", 0)
      //.style("fill", function(d) { return viz.color(d.key); })
      .style("fill", "#444")
      .text(function(d) { return d.key; })

    // Remove players
    test.exit().selectAll("circle")
      .transition().duration(1000)
        .attr("cx", 0)
        .attr("cy", height)
      .remove();
    test.exit().selectAll(".line")
      .transition().duration(1000)
      // TODO: This has to have the correct number of segments! (need a method for this):
        .attr("d", "M0," + height + "H0V" + height)
      .remove();
    test.exit().selectAll(".nick")
      .transition().duration(1000)
        .attr("cx", 0).attr("cy", height)
      .remove();
    // At the end of the transition, remove the player layer entirely
    test.exit().transition().duration(1000).remove();
      }, 2000);*/
}

/**
 * The select was changed for the single game Goals by Time.
 */
function changeGameGoalsByTime()
{
  var gameId = $('#game-goals-by-time').val();
  if (gameId <= 0) loadGameGoalsByTime({});
  else
  {
    // Grab data from the server
    $.ajax('/history/game/' + gameId, {
      dataType: 'json',
      success: function(data, text, jqxhr) {
        loadGameGoalsByTime(data);
      },
      error: function(jqxhr, text, error) {
        // TODO: maybe setup image and color in case this is a warning?
        loadGameGoalsByTime({});
        $('.ui.modal .description').empty();
        $('.ui.modal .description').append("<p>" + jqxhr.responseJSON.error + "</p>");
        $('.ui.modal').modal('show');
      }
    });
  }
}

/**
 * Display game data for a single game (goals by time).
 * NOTE: Must be able to handle an empty object to unload the graph...
 */
function loadGameGoalsByTime(gameData)
{
  // First create a game skeleton, if passed an empty object.
  if (!gameData.when)
  {
    gameData.when = new Date();
    gameData.threshold = 5;
    gameData.goals = {};
  }

  // Now adjust our domains
  var svg = d3.select('#history-graph svg .canvas');
  viz.bytime.y.domain([0, gameData.threshold]);
  xMax = new Date(gameData.when);
  d3.map(gameData.goals).forEach(function(nick, goals) {
    playerMax = d3.max(goals, function(d) { return new Date(d.when); });
    xMax = d3.max([xMax, playerMax]);
  });
  viz.bytime.x.domain([new Date(gameData.when), xMax]);
  viz.color.domain(d3.keys(gameData.goals));

  // Refresh axes
  svg.select(".y.axis").call(viz.bytime.yAxis);
  svg.select(".x.axis").call(viz.bytime.xAxis);

  // Update list (adjust existing data to correct NEW locations)
  var player = svg.selectAll(".player")
    .data(d3.entries(gameData.goals), function(d) { return d.key; });
  player.select(".line").transition().duration(1000)
    .attr("d", function(d) { console.log("OLD Data: ", d3.select(this).attr("d")); console.log("NEW: ", viz.bytime.line(d.value)); return viz.bytime.line(d.value); });
  var circles = player.selectAll("circle")
    .data(function(d) { return d.value; });
  // Existing data
  circles.transition().duration(1000)
      .attr("cx", function(d) { return viz.bytime.x(new Date(d.when)); })
      .attr("cy", function(d) { return viz.bytime.y(d.num); });
  // New data
  circles.enter()
    .append("circle")
    .attr("class", "line-point").attr("r", 3.5).attr("cx", 0).attr("cy", viz.bytime.height)
  .transition().duration(1000)
    .attr("cx", function(d) { return viz.bytime.x(new Date(d.when)); })
    .attr("cy", function(d) { return viz.bytime.y(d.num); });
  // Removed data
  circles.exit().transition().duration(1000)
    .attr("cx", 0).attr("cy", viz.bytime.height)
    .remove();
  player.select(".nick")
    .datum(function(d) { return {key: d.key, value: d.value[d.value.length - 1]}; })
    .transition().duration(1000)
    .attr("transform", function(d) { 
      return "translate(" + viz.bytime.x(new Date(d.value.when)) + "," + viz.bytime.y(d.value.num) + ")"; 
    });

  // Enter list
  var enter = player.enter()
    .append("g")
      .style("stroke", function(d) { return viz.color(d.key); })
      .attr("class", "player");
  enter.append("path")
    .attr("class", "line")
    .style("stroke", function(d) { return viz.color(d.key); })
    // TODO: Make this out of the threshold (# L segments == number of goals)
    .attr("d", "M0," + viz.bytime.height + 
      "L0," + viz.bytime.height + 
      "L0," + viz.bytime.height + 
      "L0," + viz.bytime.height + 
      "L0," + viz.bytime.height + 
      "L0," + viz.bytime.height)
  .transition().duration(1000)
    .attr("d", function(d) { return viz.bytime.line(d.value); })
    .style("stroke-width", 1.5);
  // Line points:
  enter.selectAll("circle")
    .data(function(d) { return d.value; }).enter()
    .append("circle")
      .attr("class", "line-point")
      .attr("r", 3.5)
      .attr("cx", 0).attr("cy", viz.bytime.height)
    .transition().duration(1000)
      .attr("cx", function(d) { return viz.bytime.x(new Date(d.when)); })
      .attr("cy", function(d) { return viz.bytime.y(d.num); });
  // Nickname text:
  enter.append("text")
    .datum(function(d) { return {key: d.key, value: d.value[d.value.length - 1]}; })
    .style("stroke-width", 0)
    .style("fill", "none")
    .attr("dx", 7)
    .attr("transform", "translate(0," + viz.bytime.height + ")")
  .transition().duration(1000)
    .attr("transform", function(d) { 
      return "translate(" + viz.bytime.x(new Date(d.value.when)) + "," + viz.bytime.y(d.value.num) + ")"; 
    })
    .attr("class", "nick")
    .style("stroke-width", 0)
    .style("fill", "#444")
    .text(function(d) { return d.key; });

  // Exit list
  var exit = player.exit();
  exit.selectAll("circle")
    .transition().duration(1000)
      .attr("cx", 0)
      .attr("cy", viz.bytime.height)
    .remove();
  exit.selectAll(".line")
    .transition().duration(1000)
    // TODO: This has to have the correct number of segments! (need a method for this):
      .attr("d", function(d) { 
        console.log("Exit data: ", d);
        var line = "M0," + viz.bytime.height;
        for (i = 1; i < d.value.length; i++)
          line += "H0V" + viz.bytime.height;
        console.log(line);
        return line;
      })
    .remove();
  exit.selectAll(".nick")
    .transition().duration(1000)
      .attr("cx", 0).attr("cy", viz.bytime.height)
    .remove();
  // At the end of the transition, remove the player layer entirely
  exit.transition().duration(1000).remove();
}


// TODO: Maybe this should be in a 'homepage.js' file...
/**
 * Display the pie chart for the most recently played game.
 */
function initHomePage()
{
  $.get('/games/last-week', {}, function(data, text, xhr) {
    // Put a link to the most recent game
    if (data && data.games)
    {
      if (data.games.length === 0)
        $('#last-game').append('<h2 style="text-align:center">No games played in the last week</h2>');
      else
      {
        var when = new Date(Date.parse(data.games[0].when));
        var h = when.getHours();
        var m = when.getMinutes() < 10 ? "0" + when.getMinutes() : when.getMinutes();
        var time = (h > 12) ? (h - 12) + ':' + m + 'pm' : h + ':' + m + 'am';
        var date = getDateShortDisplay(when) + ' @ ' + time;
        $('#last-game').append('<h2><a href="/game/' + data.games[0].id + '">' + date + '</h2>');

        // Get most recent data into memory
        gameHistory = data.games;

        // And kick off the D3 rendering of the pie chart
        setupVisualization();
      }
    }
  });

  // Setup our leaderboard
  $.get('/players/leaderboard', {}, function(players, text, xhr) {

    //$('.ui.dropdown').dropdown();

    $('#statsDropdown').dropdown({
        onChange: function(value, text, $selectedItem) {
          if (value === 'game')
          {
            $('table .gd').addClass('hidden');
            $('table .game').removeClass('hidden');
          }
          else if (value === 'game-day')
          {
            $('table .game').addClass('hidden');
            $('table .gd').removeClass('hidden');
          }
        }
      });
    $('#statsDropdown').dropdown('set selected', 'game');

    if (players)
    {
      var lb = $('#leaderboard tbody') ;
      if (!lb) return ;

      $.each(players,  function(index) {
        var player = players[index] ;
        var rowClass = (player.retired) ? 'disabled' : '' ;
        if (player.nick === null) player.nick = '';

        // Make a new row for this player
        var name = '<td><h4 class="ui header"><div class="content">' + player.name + '<div class="sub header">' + player.nick + '</div></div></h4></td>' ;
        var gf = '<td>' + player.goals + '</td>' ;
        var record = '<td class="game record">' + player.wins + '/' + player.losses + ' (' + player.embs + ')</td>' ;
        var gdRecord = '<td class="gd record hidden">' + Math.round(player.gameDayWins*100)/100 + '/' + Math.round(player.gameDayLosses*100)/100 + '(' + player.gameDayEmbs + ')</td>';
        var wins = '<td class="game record-fw">' + player.wins + '</td>' ;
        var losses = '<td class="game record-fw">' + player.losses + '</td>' ;
        var embs = '<td class="game record-fw">' + player.embs + '</td>' ;
        var gdWins = '<td class="gd record-fw hidden">' + Math.round(player.gameDayWins * 100)/100 + '</td>';
        var gdLosses = '<td class="gd record-fw hidden">' + Math.round(player.gameDayLosses * 100)/100 + '</td>';
        var gdEmbs = '<td class="gd record-fw hidden">' + player.gameDayEmbs + '</td>';
        var winpStr = '<td class="game">-</td>';
        if ((player.wins + player.losses) !== 0)
        {
          var winp = (player.wins / (player.wins + player.losses));
          winp = Math.floor(winp * 10000) / 100;
          winpStr = '<td class="game">' + winp + '%</td>';
        }

        var gdWinpStr = '<td class="gd hidden">-</td>';
        if ((player.gameDayWins + player.gameDayLosses) !== 0)
        {
          var gdwinp = (player.gameDayWins / (player.gameDayWins + player.gameDayLosses));
          gdwinp = Math.floor(gdwinp * 10000) / 100;
          gdWinpStr = '<td class="gd hidden">' + gdwinp + '%</td>';
        }

        lb.append('<tr class="' + rowClass + '">' + name + gf + record + wins + losses + embs + winpStr + gdRecord + gdWins + gdLosses + gdEmbs + gdWinpStr + '</tr>') ;
      }) ;
    }
  }) ;
}

/**
 * Setup visualization. Using data from the most recent game.
 * TODO: http://stackoverflow.com/questions/16265123/resize-svg-when-window-is-resized-in-d3-js
 */
function setupVisualization()
{
  var width = 500, height = 350;
  var radius = Math.min(width, height) / 2;

  // Define our palette
  viz.color = d3.scale.ordinal().range(["#4e9a06", "#057740", "#8ea606", 
    "#84cf3e", "#30a06a", "#c8df43",
    "#295500", "#004222", "#4e5b00"]); 

  var outer = radius - 10;
  viz.arc = d3.svg.arc().outerRadius(outer).innerRadius(0);
  viz.textarc = d3.svg.arc().outerRadius(outer).innerRadius(outer / 3);

  viz.pie = d3.layout.pie()
    // default sort is descending order
    // Grab data using the "goals" property on a player
    .value(function(d) { return d.goals; });

  var svg = d3.select("#last-game").append("svg")
      .attr("width", width)
      .attr("height", height)
    .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  // Load data from the most recent game in the gameHistory global, (or nothing if empty)
  //   D3 needs an array of values that can be read using the FUNC from
  //   "d3.layout.pie().value(FUNC)"
  var data = (gameHistory) ? gameHistory[0].players : [];

  var g = svg.selectAll()
      .data(viz.pie(data))
    .enter().append("g")
      .attr("class", "arc");

  g.append("path")
      .attr("d", viz.arc)
      .style("fill", function(d) { return viz.color(d.data.name); })
      // Save the _current start for each arc:
      .each(function(d) { this._current = d; });

  var label = g.append("g")
      .attr("transform", function(d) { return "translate(" + viz.textarc.centroid(d) + ")"; })
      .attr("id", function(d) { return "player-arc-" + d.data.id; } )
      .style("text-anchor", "middle");
  label.append("text")
      .style("font-weight", "bold")
      .attr("class", "name")
      .text(function(d) { return (d.data.goals > 0) ? d.data.name : ""; });
  label.append("text")
      .attr("dy", "1.1em")
      .attr("class", "goals")
      .text(function(d) { return (d.data.goals > 0) ? d.data.goals : ""; });
}

/**
 * Load data into the graph from the last game.
 */
function loadLastGame()
{
  if (!gameHistory) return;
  var gameDay = new Date(Date.parse(gameHistory[0].when));
  var h = gameDay.getHours();
  var m = gameDay.getMinutes() < 10 ? "0" + gameDay.getMinutes() : gameDay.getMinutes();
  var time = (h > 12) ? (h - 12) + ':' + m + 'pm' : h + ':' + m + 'am';
  var date = getDateShortDisplay(gameDay) + ' @ ' + time;
  $('#last-game h2').replaceWith('<h2><a href="/game/' + gameHistory[0].id + '">' + date + '</a></h2>');

  changeData(first(gameHistory));
}

/**
 * Load data into graph for the last "game day".
 */
function loadGameDay()
{
  if (!gameHistory) return;
  var gameDay = new Date(Date.parse(gameHistory[0].when));
  $('#last-game h2').replaceWith('<h2>' + getDateShortDisplay(gameDay) + '</h2>');

  // Sum all data from the same y/m/d of the latest game in our gameHistory
  var data = first(gameHistory);
  for (var i = 1; i < gameHistory.length; i++)
  {
    var day = new Date(Date.parse(gameHistory[i].when));
    if (!(day.getYear() == gameDay.getYear() && 
      day.getMonth() == gameDay.getMonth() &&
      day.getDate() == gameDay.getDate()))
      continue;
    for (var pidx = 0; pidx < data.length; pidx++)
    {
      data[pidx].goals += gameHistory[i].players[pidx].goals;
    }
  }

  changeData(data);
}

/**
 * Handle window size changes
 */
function updateWindow(container)
{
  var w = $(container).width();
  $("svg").attr("width", w);
  viz.bytime.width = w - viz.bytime.margin.left - viz.bytime.margin.right;
  // TODO: force D3 to reload/redraw data
}

/**
 * Get a day as a string.
 */
function getDateShortDisplay(d)
{
  var date = d.getFullYear() + ' / ' + (d.getMonth() + 1) + ' / ' + d.getDate();
  return date;
}

/**
 * Load data into graph for the last "week" (our full gameHistory).
 */
function loadWeek()
{
  if (!gameHistory) return;

  var gameDay = new Date(Date.parse(gameHistory[0].when));
  var startDay = new Date(Date.parse(gameHistory[0].when));
  startDay.setDate(gameDay.getDate() - 7);
  $('#last-game h2').replaceWith('<h2>' + getDateShortDisplay(startDay) + ' &mdash; ' + getDateShortDisplay(gameDay) + '</h2>');

  // Sum all data from the same y/m/d of the latest game in our gameHistory
  var data = first(gameHistory);
  for (var i = 1; i < gameHistory.length; i++)
    for (var pidx = 0; pidx < data.length; pidx++)
      data[pidx].goals += gameHistory[i].players[pidx].goals;

  changeData(data);
}

/**
 * Helper method: Clone the first value out of this players array.
 */
function first(game)
{
  var ret = [];
  game[0].players.forEach(function(player) {
    ret.push({id: player.id, name: player.name, email: player.email, goals: player.goals});
  });
  return ret;
}

/**
 * Change the pie chart to display the new data as specified by the parameter.
 */
function changeData(data)
{
  // All current pie slices (just the paths)
  var sliceLayer = d3.selectAll("#last-game svg .arc");

  // Update data to new values (on the .arc, and all children)
  sliceLayer.data(viz.pie(data));

  // Create a transition
  var t1 = sliceLayer.transition().duration(1000);

  // Animate the path change
  t1.select("path").attrTween("d", arcTween);
  // And the text position
  t1.select("g").attr("transform", function(d) { return "translate(" + viz.textarc.centroid(d) + ")"; });
  // And text values (after the objects move)
  var t2 = t1.transition();
  t2.select("g .name").text(function(d) { return (d.data.goals > 0) ? d.data.name : ""; });
  t2.select("g .goals").text(function(d) { return (d.data.goals > 0) ? d.data.goals : ""; });
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
    return viz.arc(i(t));
  };
}
