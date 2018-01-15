var FoosTracker = FoosTracker || {};

/**
 * Initialize the leaderboard table of data, and setup the menu buttons.
 */
function initLeaderboard()
{
  FoosTracker.leaderboard = {};
  var lb = FoosTracker.leaderboard;
  
  // Setup the menu buttons
  var now = new Date();
  lb.year = new Date(now.getFullYear(), 0, 1);
  lb.quarter = new Date(now.getFullYear(), now.getMonth() - (now.getMonth() % 3), 1);
  lb.month = new Date(now.getFullYear(), now.getMonth(), 1);
  lb.week = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  lb.week.setHours(-24 * (lb.week.getDay() > 0 ? (lb.week.getDay() - 1) : 6));
  // Exact values will be filled async, use defaults for now (should be fine)
  lb.gameday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  lb.lastgame = now;
  $.get('/api/games/last', {}, function(data, text, xhr) {
    lastgame=new Date(data.games[0].when);
    lb.gameday=new Date(lastgame.getFullYear(), lastgame.getMonth(), lastgame.getDate());
    lb.lastgame = lastgame;
  });

  // Setup the main leaderboard dropdown
  var lbActions = $('#leaderboard-actions .dropdown').dropdown({onChange: selectFromDropdown});
  lbActions.dropdown('set selected', 'Month');
  $('#leaderboard-year').on('click', function() { lbActions.dropdown('set selected', 'Year'); });
  $('#leaderboard-quarter').on('click', function() { lbActions.dropdown('set selected', 'Quarter'); });
  $('#leaderboard-month').on('click', function() { lbActions.dropdown('set selected', 'Month'); });
  $('#leaderboard-week').on('click', function() { lbActions.dropdown('set selected', 'Week'); });
  $('#leaderboard-gameday').on('click', function() { lbActions.dropdown('set selected', 'Game Day'); });
  $('#leaderboard-lastgame').on('click', function() { lbActions.dropdown('set selected', 'Last Game'); });

  // Setup the stat grouping buttons
  $('.stats-btn-std').on('click', function() {
    $('.stats-btn-std').addClass('active');
    $('.stats-btn-gd').removeClass('active');
    $('table .gd').addClass('hidden');
    $('table .game').removeClass('hidden');
  });
  $('.stats-btn-gd').on('click', function() {
    $('.stats-btn-std').removeClass('active');
    $('.stats-btn-gd').addClass('active');
    $('table .game').addClass('hidden');
    $('table .gd').removeClass('hidden');
  });
}

/**
 * Helper method to load a specified date range to the leaderboard.
 */
function loadLeaderboard(time)
{
  $.get('/api/players/stats/' + time, {}, function(data, text, xhr) {
    // Reset the stats
    $('.stats-btn-std').addClass('active');
    $('.stats-btn-gd').removeClass('active');
    $('table .gd').addClass('hidden');
    $('table .game').removeClass('hidden');

    // Reset the table
    var lb = $('#leaderboard tbody') ;
    lb.empty();
    
    // Process results
    if (data.stats && data.stats.length > 0)
    {
      data.stats.forEach(function(player) {
        var rowClass = (player.retired) ? 'disabled' : '' ;
        if (player.nick === null) player.nick = '';

        // Make a new row for this player
        var name = '<td><h4 class="ui header"><div class="content">' + player.name + '<div class="sub header">' + player.nick + '</div></div></h4></td>' ;
        var gf = '<td class="game">' + player.goals + '</td>' ;
        var record = '<td class="game record">' + player.wins + '-' + player.losses + ' (' + player.embs + ')</td>' ;
        var gdRecord = '<td class="gd record hidden">' + player.gameDayWins + '-' + player.gameDayLosses + '-' + player.gameDayTies + '(' + player.gameDayEmbs + ')</td>';
        var wins = '<td class="game record-fw">' + player.wins + '</td>' ;
        var losses = '<td class="game record-fw">' + player.losses + '</td>' ;
        var embs = '<td class="game record-fw">' + player.embs + '</td>' ;
        var gdWins = '<td class="gd record-fw hidden">' + player.gameDayWins + '</td>';
        var gdLosses = '<td class="gd record-fw hidden">' + player.gameDayLosses + '</td>';
        var gdTies = '<td class="gd record-fw hidden">' + player.gameDayTies + '</td>';
        var gdEmbs = '<td class="gd record-fw hidden">' + player.gameDayEmbs + '</td>';
        var winpStr = '<td class="game">-</td>';
        if ((player.wins + player.losses) !== 0)
        {
          var winp = (player.wins / (player.wins + player.losses));
          winp = Math.floor(winp * 10000) / 100;
          winpStr = '<td class="game">' + winp + '%</td>';
        }

        var gdWinpStr = '<td class="gd hidden">-</td>';
        if ((player.gameDayWins + player.gameDayLosses + player.gameDayTies) !== 0)
        {
          var playerWins = player.gameDayWins;
          var playerLosses = player.gameDayLosses;
          var playerTies = player.gameDayTies;

          var gdwinp = (playerWins / (playerWins + playerLosses + playerTies));
          gdwinp = Math.floor(gdwinp * 10000) / 100;
          gdWinpStr = '<td class="gd hidden">' + gdwinp + '%</td>';
        }

        lb.append('<tr class="' + rowClass + '">' + name + gf + record + wins + losses + embs + winpStr + gdRecord + gdWins + gdLosses + gdTies + gdEmbs + gdWinpStr + '</tr>') ;
      }) ;
    }
    else
    {
      // NOTE: Not sure a hardcoded "colspan" is the best approach here, but it works...
      lb.append('<td colspan="6">No games yet for this time period!</td>');
    }
  }) ;
}

/**
 * Helper function for the selection change from the mobiel dropdown menu item.
 */
function selectFromDropdown(value, text){
  if (value == 'year') selectYear();
  else if (value == 'quarter') selectQuarter();
  else if (value == 'month') selectMonth();
  else if (value == 'week') selectWeek();
  else if (value == 'game day') selectGameDay();
  else if (value == 'last game') selectLastGame();
}

/**
 * Helper to select the Year menu item.
 */
function selectYear()
{
  $('#leaderboard-actions a.item').removeClass('active');
  $('#leaderboard-year').addClass('active');
  $('#leaderboard-actions .dropdown').dropdown('set selected', 'Year');

  loadLeaderboard(FoosTracker.leaderboard.year.getTime());
  $('#leaderboard-date').empty().append(FoosTracker.leaderboard.year.getFullYear());
}
/**
 * Helper to select the Quarter menu item.
 */
function selectQuarter()
{
  $('#leaderboard-actions a.item').removeClass('active');
  $('#leaderboard-quarter').addClass('active');
  $('#leaderboard-actions .dropdown').dropdown('set selected', 'Quarter');
  
  loadLeaderboard(FoosTracker.leaderboard.quarter.getTime());
  $('#leaderboard-date').empty().append("Q" + ((FoosTracker.leaderboard.quarter.getMonth() / 3) + 1));
}
/**
 * Helper to select the Month menu item.
 */
function selectMonth()
{
  $('#leaderboard-actions a.item').removeClass('active');
  $('#leaderboard-month').addClass('active');
  $('#leaderboard-actions .dropdown').dropdown('set selected', 'Month');
  
  loadLeaderboard(FoosTracker.leaderboard.month.getTime());
  var month = FoosTracker.leaderboard.month.toLocaleString('en-us', {month: "long"});
  $('#leaderboard-date').empty().append(month + ", " + FoosTracker.leaderboard.month.getFullYear());
}

/**
 * Helper to select the Week menu item.
 */
function selectWeek()
{
  $('#leaderboard-actions a.item').removeClass('active');
  $('#leaderboard-week').addClass('active');
  $('#leaderboard-actions .dropdown').dropdown('set selected', 'Week');
  
  loadLeaderboard(FoosTracker.leaderboard.week.getTime());
  var date = FoosTracker.leaderboard.week;
  var month = date.toLocaleString('en-us', {month: "long"});
  var day = date.getDate();
  if (date.getDate() == 1 || date.getDate() == 21 || date.getDate() == 31)
    day += "st";
  else if (date.getDate() == 2 || date.getDate() == 22)
    day += "nd";
  else if (date.getDate() == 3 || date.getDate() == 23)
    day += "rd";
  else
    day += "th";
  $('#leaderboard-date').empty().append(month + " " + day + ", " + date.getFullYear());
}

/**
 * Helper to select the GameDay menu item.
 */
function selectGameDay()
{
  $('#leaderboard-actions a.item').removeClass('active');
  $('#leaderboard-gameday').addClass('active');

  loadLeaderboard(FoosTracker.leaderboard.gameday.getTime());
  var date = FoosTracker.leaderboard.gameday;
  var month = date.toLocaleString('en-us', {month: "long"});
  var day = date.getDate();
  if (date.getDate() == 1 || date.getDate() == 21 || date.getDate() == 31)
    day += "st";
  else if (date.getDate() == 2 || date.getDate() == 22)
    day += "nd";
  else if (date.getDate() == 3 || date.getDate() == 23)
    day += "rd";
  else
    day += "th";
  $('#leaderboard-date').empty().append(month + " " + day + ", " + date.getFullYear());
}

/**
 * Helper to select the last Game played menu item.
 */
function selectLastGame()
{
  $('#leaderboard-actions a.item').removeClass('active');
  $('#leaderboard-lastgame').addClass('active');
  loadLeaderboard(FoosTracker.leaderboard.lastgame.getTime());
  $('#leaderboard-date').empty().append(FoosTracker.leaderboard.lastgame.toLocaleString('en-us', {date: "long"}));
}
