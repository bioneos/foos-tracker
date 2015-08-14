<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width">
  <title>{{ title }}</title>
  <link rel="stylesheet" href="/css/style.css">
  <link rel="stylesheet" href="/semantic.min.css">
  {% if ENV_DEVELOPMENT %}
    <script src="http://localhost:35729/livereload.js"></script>
  {% endif %}
</head>
<body>
  <div class="ui container">
    {% block content %}{% endblock %}
  </div>
  <script src="https://code.jquery.com/jquery-2.1.4.min.js"></script>
  <script src="/semantic.min.js"></script>
  {% block scripts %}{% endblock %}
</body>
</html>
