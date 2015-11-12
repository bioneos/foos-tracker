{% extends 'layout.swig' %}

{% block content %}
<h1>Game Play History</h1>
<div class="history container">
  <div class="controls">
    <h4>Goals over time (Single Game):</h4>
    <select id="game-goals-by-time" class="ui dropdown">
      <option value="0">Select a game...</option>
    </select>
  </div>
  <div id="history-graph"></div>
</div>
<div class="ui basic modal">
  <i class="close icon"></i>
  <div class="header">
    Oops... Something went wrong
  </div>
  <div class="image content">
    <div class="red image">
      <i class="warning sign icon"></i>
    </div>
    <div class="description">
      <p></p>
    </div>
  </div>
  <div class="actions">
    <div class="one fluid ui inverted buttons">
      <div class="ui green basic inverted button">
        OK
      </div>
    </div>
  </div>
</div>
{% endblock %}

{% block scripts %}
  <script src="/js/main.js"></script>
  <script src="/js/history.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.min.js"></script>
  <script>
    $(document).on('ready', function() { 
      $('.ui.model').modal();
      initHistoryPage(); 
    });
  </script>
{% endblock %}

