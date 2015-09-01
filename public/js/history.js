var gameHistory = {};

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
        $('#last-game').append('<h2>No Game History!</h2>');
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
    if (players)
    {
      var lb = $('#leaderboard tbody') ;
      if (!lb) return ;

      console.log(players) ;
      $.each(players,  function(index) {
        var player = players[index] ;
        // Make a new row for this player
        var name = '<td><h4 class="ui header"><div class="content">' + player.name + '<div class="sub header">' + player.nick + '</div></div></h4></td>' ;
        var gf = '<td>' + player.goals + '</td>' ;
        var wins = '<td>' + player.wins + '</td>' ;
        var losses = '<td>' + player.losses + '</td>' ;
        var embs = '<td>' + player.embs + '</td>' ;
        var winp = '<td>' + (player.wins / (player.wins + player.losses)) + '</td>' ;
        lb.append('<tr>' + name + gf + wins + losses + embs + winp + '</tr>') ;
      }) ;
    }
  }) ;
}

// Global namespace for caching some of the configured d3 settings
var viz = {};

/**
 * Setup visualization. Using data from the most recent game.
 */
function setupVisualization()
{
  var width = 500, height = 350;
  var radius = Math.min(width, height) / 2;

  // Define our palette
  //var color = d3.scale.ordinal().range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
  var color = d3.scale.ordinal().range(["#4e9a06", "#057740", "#8ea606", 
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
      .style("fill", function(d) { return color(d.data.name); })
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
 * Clone the first value out of this players array.
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
 *

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
