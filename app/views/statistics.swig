{% extends 'layout.swig' %}

{% block sidebar %}
<!-- Hidden sidebar content -->
<div class="ui inverted basic segment top sidebar" style="min-height: 40%;" id="game-id-popup">
  <div id="game-id-selection" class="ui inverted basic center aligned segment">
    <h4 class="ui header">Single Game</h4>
    <div class="ui selection dropdown">
      <input type="hidden" id="game-id-input">
      <i class="dropdown icon"></i>
      <div class="default text">Please select a Game...</div>
      <div class="menu"> </div>
    </div>
  </div>
  <div id="date-range-selection" class="ui inverted basic center aligned segment">
    <h4 class="ui header">Date range</h4>
    <div>
      &lt; <div class="ui input">
        <input type="textfield" id="date-range-input-start" placeholder="yyyy/mm/dd">
      </div>
      &gt;
    </div>
    <div>
      &lt;
      <div class="ui input">
        <input type="textfield" id="date-range-input-end" placeholder="yyyy/mm/dd">
      </div>
      &gt;
    </div>
    <div class="ui center aligned basic segment">
      <button id="date-range-update" class="ui button">Update Graph</button>
    </div>
  </div>
</div>

{% endblock %}


{% block content %}
<!-- Graph configuration across the top -->
<div class="ui top attached center aligned segment">
  <div class="ui large header dropdown" id="graph-type">
    <input type="hidden" name="graph-type-input">
    <div class="text">Select a Graph...</div>
    <div class="menu">
      <div class="item" id="graph-game">Game</div>
      <div class="item" id="graph-g">Goals</div>
      <div class="item" id="graph-got">Goals over Time</div>
      <div class="item" id="graph-wot">Wins over Time</div>
      <div class="disabled item" id="graph-eot">Embs over Time</div>
      <div class="disabled item" id="graph-gl">Game Length</div>
      <div class="disabled item" id="graph-wogl">Wins over GL</div>
      <div class="disabled item" id="graph-eogl">Embs over GL</div>
    </div>
  </div>
  <a id="foos-graph-options" class="ui circular small right floated icon button">
    <i class="icon setting"></i>
  </a>
</div>


<!-- Main graph --> 
<div class="ui bottom attached segment">
  <div id="foos-graph">
    <svg></svg>
  </div>
</div>

<!-- Not needed? -->
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
  <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/4.2.1/d3.js"></script>
  <script src="/js/main.js"></script>
  <script src="/js/graphs/foos.js"></script>
  <script src="/js/graphs/wot.js"></script>
  <script src="/js/graphs/got.js"></script>
  <script src="/js/graphs/g.js"></script>
  <script src="/js/graphs/game.js"></script>
  <script src="/js/graph.js"></script>
  <script>
    $(document).on('ready', function() { 
      $('.ui.model').modal();
      $('.ui.dropdown').dropdown();
    });
  </script>
{% endblock %}

