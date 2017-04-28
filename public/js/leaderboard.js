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
  lb.month = new Date(now.getFullYear(), now.getMonth(), 1);
  lb.week = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  lb.week.setHours(-24 * (lb.week.getDay() > 0 ? (lb.week.getDay() - 1) : 6));
  // Make API route to get details of last game played (/game/last)
  lb.gameday = 'TODO'; 
  lb.game = 'TODO';
  // TODO
  $('#leaderboard-month').on('click', selectMonth);
  $('#leaderboard-week').on('click', selectWeek);
  $('#leaderboard-gameday').on('click', selectGameDay);
  $('#leaderboard-game').on('click', selectGame);

  // Setup the stat grouping dropdown
  $('#stats-btn-std').on('click', function() {
    $('table .gd').addClass('hidden');
    $('table .game').removeClass('hidden');
  });
  $('#stats-btn-gd').on('click', function() {
    $('table .game').addClass('hidden');
    $('table .gd').removeClass('hidden');
  });

  // Setup our leaderboard with default display of "Current Month"
  loadLeaderboard(lb.month.getTime())
}

/**
 * Helper method to load a specified date range to the leaderboard.
 * TODO: cache the results
 * TODO: fix the GameDay setup
 */
function loadLeaderboard(time)
{
  $.get('/api/players/stats/' + time, {}, function(data, text, xhr) {
    // Reset the stats
    $('#statsDropdown').dropdown('set selected', 'game');
    $('table .gd').addClass('hidden');
    $('table .game').removeClass('hidden');

    // Reset the table
    var lb = $('#leaderboard tbody') ;
    lb.empty();
    
    // Process results
    if (data.stats)
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
      lb.append('<td colspan="6">Apparently no one has been playing lately!</td>');
    }
  }) ;
}

/**
 * Helper to select the Month menu item.
 */
function selectMonth()
{
  $('#leaderboard-actions a.item').removeClass('active');
  $('#leaderboard-month').addClass('active');
  loadLeaderboard(FoosTracker.leaderboard.month.getTime());
}

/**
 * Helper to select the Week menu item.
 */
function selectWeek()
{
  $('#leaderboard-actions a.item').removeClass('active');
  $('#leaderboard-week').addClass('active');
  loadLeaderboard(FoosTracker.leaderboard.week.getTime());
}

/**
 * Helper to select the GameDay menu item.
 */
function selectGameDay()
{
  $('#leaderboard-actions a.item').removeClass('active');
  $('#leaderboard-gameday').addClass('active');
  loadLeaderboard(FoosTracker.leaderboard.gameday.getTime());
}

/**
 * Helper to select the Game menu item.
 */
function selectGame()
{
  $('#leaderboard-actions a.item').removeClass('active');
  $('#leaderboard-game').addClass('active');
  loadLeaderboard(FoosTracker.leaderboard.game.getTime());
}
