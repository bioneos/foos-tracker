<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width">
  {% if !title %}<title>BN Foosball Tracker</title>{% endif %}
  {% if title %}<title>[ {{ title }} ]  BN Foosball Tracker</title>{% endif %}
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.4.0/css/font-awesome.min.css">
  <link rel="stylesheet" href="/semantic.min.css">
  <link rel="stylesheet" href="/css/style.css">
  {% if ENV_DEVELOPMENT %}
    <script src="http://localhost:35729/livereload.js"></script>
  {% endif %}

  <link rel="icon" type="image/png" href="/favicon.png" sizes="16x16">  
  <link rel="icon" type="image/png" href="/favicon-32.png" sizes="32x32">  
  <link rel="icon" type="image/png" href="/favicon-96.png" sizes="96x96">  
</head>
<body>
  {% block sidebar %}{% endblock %}
  <div class="pusher">
    <header class="ui fixed inverted menu">
      <div class="ui container">
        <a href="/" class="header item">
          <img id="main-logo" class="logo" src="/images/logo.png">
          {% if pagetitle %}<div id="main-title">{{pagetitle}}</div>{% endif %}
        </a>
        <a href="/players" class="header item">Players</a>
        <a href="/games" class="header item">Games</a>
        <a href="/stats" class="header item">Statistics</a>
      </div>
    </header>

    <div id="main-page-wrap" class="ui container">
      {% block content %}{% endblock %}
    </div>
  </div>
  <script src="https://code.jquery.com/jquery-2.1.4.min.js"></script>
  <script src="/semantic.min.js"></script>
  {% block scripts %}{% endblock %}
</body>
</html>
