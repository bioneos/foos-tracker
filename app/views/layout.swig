<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width">
  <title>{{ title }}</title>
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.4.0/css/font-awesome.min.css">
  <link rel="stylesheet" href="/css/style.css">
  <link rel="stylesheet" href="/semantic.min.css">
  {% if ENV_DEVELOPMENT %}
    <script src="http://localhost:35729/livereload.js"></script>
  {% endif %}
</head>
<body>
  {% block sidebar %}{% endblock %}
  <div class="pusher">
    <header class="ui fixed inverted menu">
      <div class="ui container">
        <a href="/" class="header item">
          <img id="main-logo" class="logo" src="/images/logo.png">
          {% if title %}<div id="main-title">{{title}}</div>{% endif %}
        </a>
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
