/**
 * Initialize the leaderboard table of data, with a single AJAX load. Cache
 * the rendered tables.
 */
function initLeaderboard()
{
  // Setup our leaderboard
  $.get('/api/players/stats', {}, function(data, text, xhr) {

    //$('.ui.dropdown').dropdown();
    // TODO: might be better to do a new AJAX query? Not performance wise though...

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

    if (data.stats)
    {
      var lb = $('#leaderboard tbody') ;
      if (!lb) return ;

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
        if ((player.gameDayWins + player.gameDayLosses) !== 0)
        {
          var playerWins = player.gameDayWins;
          var playerLosses = player.gameDayLosses;
          /*player.gameDayTiesRec.forEach(function(tieCount) {
            playerWins += 1/tieCount;
            playerLosses += (tieCount-1)/tieCount;
          });*/

          var gdwinp = (playerWins / (playerWins + playerLosses));
          gdwinp = Math.floor(gdwinp * 10000) / 100;
          gdWinpStr = '<td class="gd hidden">' + gdwinp + '%</td>';
        }

        lb.append('<tr class="' + rowClass + '">' + name + gf + record + wins + losses + embs + winpStr + gdRecord + gdWins + gdLosses + gdTies + gdEmbs + gdWinpStr + '</tr>') ;
      }) ;
    }
  }) ;
}
