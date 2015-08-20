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
    <input type="hidden" id="playerId" value="{{id}}"/>
    <div class="two fields">
      <div class="required field">
        <label for="name">Name:</label>
        <input id="name" name="name" type="text" placeholder="Player Name" value="{{name}}">
      </div>
      <div class="field">
        <label for="gender">Gender:</label>
        <select id="gender" name="gender" class="ui dropdown">
          <option value="man">Man</option>
          <option value="woman">Woman</option>
          <option value="machine">Machine</option>
        </select>
      </div>
    </div>
    <div class="field">
      <label for="nick">Nickname:</label>
      <input id="nick" name="nick" type="text" placeholder="The Siberian Crusher">
    </div>
    <div class="required field {% if id %}disabled{% endif %}">
      <label for="email">Email:</label>
      <input id="email" name="email" type="text" placeholder="Email address" value="{{email}}" {% if id %}disabled=""{% endif %}>
    </div>
    {% if id %}
    <div class="field">
      <div class="ui checkbox">
        <input type="checkbox" id="retired" name="retired" />
        <label for="retired">Retire this player</label>
      </div>
    </div>
    {% endif %}
    <div class="ui buttons">
      <button class="ui button positive" type="submit">{% if id %}Update{% else %}Create{% endif %}</button>
      <div class="or"></div>
      <button class="ui button">Cancel</button>
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