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

  <div class="ui segment basic" id="last-game">
    <button class="ui tiny button" onclick="loadLastGame();" title="Last Game">L</button>
    <button class="ui tiny button" onclick="loadGameDay();" title="Last Game Day">GD</button>
    <button class="ui tiny button" onclick="loadWeek();" title="Last Week">W</button>
  </div>
  <table id="leaderboard" class="ui celled padded striped table">
    <thead>
      <tr>
        <th class="single line">Player</th>
        <th>Goals For</th>
        <th>Wins</th>
        <th>Loses</th>
        <th>Embarrassments</th>
        <th>Win %</th>
    </thead>
    <tbody>
    </tbody>
  </table>
{% endblock %}

{% block scripts %}
  <script src="/js/main.js"></script>
  <script src="/js/history.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.min.js"></script>
  <script>
    $(document).on('ready', function() { initHomePage(); });
  </script>
{% endblock %}
