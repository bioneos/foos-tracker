{% extends 'layout.swig' %}

{% block scripts %}
<script src="/js/players.js"></script>
<script>
  $(document).on('ready', function() {
    initPlayerForm();
  });
</script>
{% endblock %}

{% block content %}
  <div class="ui attached message">
    <div class="header">Player Details</div>
    <p>Edit the player details, required fields are marked</p>
  </div>
  <form class="ui form attached segment {% if !idNotFound %} bottom {% endif %}">
    <input type="hidden" id="playerId" value="{{player.id}}"/>
    <div class="two fields">
      <div class="required field">
        <label for="name">Name:</label>
        <input id="name" name="name" type="text" placeholder="Player Name" value="{{player.name}}">
      </div>
      <div class="field">
        <label for="gender">Gender:</label>
        <select id="gender" name="gender" class="ui dropdown">
        {% for val in [ 'man', 'woman', 'machine'] %}
          <option value="{{val}}" {% if player.gender === val %} selected="selected" {% endif %}>{{val|capitalize}}</option>
        {% endfor %}
        </select>
      </div>
    </div>
    <div class="field">
      <label for="nick">Nickname:</label>
      <input id="nick" name="nick" type="text" placeholder="The Siberian Crusher" value="{{player.nick}}">
    </div>
    <div class="required field {% if id %}disabled{% endif %}">
      <label for="email">Email:</label>
      <input id="email" name="email" type="text" placeholder="Email address" value="{{player.email}}" {% if player.id %}disabled=""{% endif %}>
    </div>
    {% if player.id %}
    <div class="field">
      <div class="ui checkbox">
        <input type="checkbox" id="retired" name="retired" value="retired" {% if player.retired %}checked="checked" {% endif %}/>
        <label for="retired">Retire this player</label>
      </div>
    </div>
    {% endif %}
    <div class="ui buttons">
      <button class="ui button positive" type="submit">{% if player.id %}Update{% else %}Create{% endif %}</button>
      <div class="or"></div>
      <a href="/" class="ui button">Cancel</a>
    </div>
    <div class="ui error message">
    </div>
  </form>
  <div id="message" class="ui attached bottom message {% if idNotFound %} error {% endif %}">
    {% if idNotFound %}
    The requested player wasn't found, but you can create a new one
    {% endif %}
  </div>
{% endblock %}