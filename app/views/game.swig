{% extends 'layout.swig' %}

{% block scripts %}
<script>
  var gameInProgress = false ;
  var gameStart = new Date(Date.parse('{{ gameStart.toISOString() }}'));
  var gameThreshold = {{gameThreshold}};
  var gameId = {{gameId}};
  var game = {};
</script>
<script src="/js/main.js"></script>
<script src="/js/game.js"></script>
<script>
  $(document).on('ready', function() {
    initGamePage();
  });
</script>
{% endblock %}

{% block content %}
  <h1>Let's Play FOOSBALL!</h1>
  
  <div class="ui center aligned equal width grid">
    <div id="scoreboard" class="ui row"></div>
  </div>

  <div id="players" class="ui center aligned equal width grid">
    <div class="ui row"><div class="ui column"><h2 class="ui header green">Players</h2></div></div>

    <ul id="players-list" class="ui row"></ul>

    <div class="ui row controls">
      <div class="ui column">
        <select class="ui dropdown">
          <option value="0">Select a Player...</option>
        </select>
        <button class="ui large button" onclick="joinGame();" id="player-game-join">Join Game</button>
      </div> 
    </div>
  </div>
  <div id="winner" class="ui inverted green segment center aligned"></div>

  <div id="game-info" class="ui inverted segment footer">
    <div id="start-time">
      <a href="#" onclick="abortGame(event) ;"><i  class="fa fa-trash"></i></a>{{ gameStart.toString() }}
    </div>
    <div id="game-config" class="ui right labeled action input">
      <input id="threshold" type="text" placeholder="Goal Threshold" value="5">
      <div class="ui button" onclick="setThreshold($('#threshold').val())"><i class="fa fa-futbol-o"></i></div>
    </div>
  </div>
{% endblock %}
