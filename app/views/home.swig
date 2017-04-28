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

  <div class="ui segment basic" id="leaderboard-wrap">
    <div class="ui secondary pointing menu" id="leaderboard-actions">
      <a id="leaderboard-month" class="active item">Month</a>
      <a id="leaderboard-week" class="item">Week</a>
      <a id="leaderboard-gameday" class="item">Game Day</a>
      <a id="leaderboard-game" class="item">Game</a>
      <div class="right item">
        <div class="ui mini icon buttons">
          <div id="stats-btn-std" class="ui labeled icon button">
            <i class="bar chart icon"></i> Std
          </div>
          <div id="stats-btn-gd" class="ui right labeled icon button">
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
    </table>
  </div>
{% endblock %}

{% block scripts %}
  <script src="/js/home.js"></script>
  <script src="/js/leaderboard.js"></script>
  <script>
    $(document).on('ready', function() { initLeaderboard(); });
  </script>
{% endblock %}
