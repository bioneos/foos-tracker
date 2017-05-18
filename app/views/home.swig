{% extends 'layout.swig' %}

{% block content %}
  <div id="messages">
    {% for msg in messages %}
      {% if loop.first %}<ul>{% endif %}
      <li>{{ msg }}</li>
      {% if loop.last %}</ul>{% endif %}
    {% endfor %}
  </div>
  <div class="ui segment basic">
    <button class="ui button" onclick="newGame();">Start a New Game</button>
    <a href="/players/create" class="ui button">Add a Player</a>
  </div>

  <div class="ui segment basic" id="recent-games-wrap">
    <h2>Recent Games</h2>
    <svg id="recent-games"></svg>
  </div>

  <div class="ui segment basic" id="leaderboard-wrap">
    <h2>Leaderboard</h2>
    <div class="ui menu" id="leaderboard-actions">
      <div id="leaderboard-dropdown" class="ui selection dropdown item item-mobile">
        <input type="hidden" name="lb-date">
        <div class="default text">Select Period</div>
        <div class="menu">
          <div class="item">Year</div>
          <div class="item">Quarter</div>
          <div class="item">Month</div>
          <div class="item">Week</div>
        </div>
      </div>
      <a id="leaderboard-year" class="active item item-fw">Year</a>
      <a id="leaderboard-quarter" class="item item-fw">Quarter</a>
      <a id="leaderboard-month" class="item item-fw">Month</a>
      <a id="leaderboard-week" class="item item-fw">Week</a>
      <div class="right item item-mobile">
        <div class="ui mini icon buttons">
          <div class="stats-btn-std ui icon button">
            <i class="bar chart icon"></i>
          </div>
          <div class="stats-btn-gd ui right icon button">
            <i class="calendar outline icon"></i>
          </div>
        </div>
      </div>
      <div class="right item item-fw">
        <div class="ui mini labeled icon buttons">
          <div class="stats-btn-std ui icon button">
            <i class="bar chart icon"></i> Std
          </div>
          <div class="stats-btn-gd ui right icon button">
            GD <i class="calendar outline icon"></i>
          </div>
        </div>
      </div>
    </div>
    <table id="leaderboard" class="ui celled padded striped table unstackable">
      <thead>
        <tr>
          <th class="single line">Player</th>
          <th class="game">Goals</th>
          <th class="game record">Record</th>
          <th class="game record-fw">Wins</th>
          <th class="game record-fw">Losses</th>
          <th class="game record-fw">Embarrassments</th>
          <th class="game">Win %</th>
          <th class="gd record hidden">GD Record</th>
          <th class="gd record-fw hidden">GD Wins</th>
          <th class="gd record-fw hidden">GD Losses</th>
          <th class="gd record-fw hidden">GD Ties</th>
          <th class="gd record-fw hidden">GD Embarrassments</th>
          <th class="gd hidden">GD Win %</th>
      </thead>
      <tbody>
      </tbody>
      <tfoot class="full-width">
        <tr><th id="leaderboard-date" colspan="6">Date</th></tr>
      </tfoot>
    </table>
  </div>
{% endblock %}

{% block scripts %}
  <script src="/js/home.js"></script>
  <script src="/js/leaderboard.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/4.2.1/d3.js"></script>
  <script src="/js/recentGames.js"></script>
  <script>
    $(document).on('ready', function() { initLeaderboard(); });
  </script>
{% endblock %}
