# AlertX - SOS Emergency Alert System (Django + PostgreSQL)

AlertX is an emergency alert web app built with Django, PostgreSQL, and a browser-based SOS workflow (camera + geolocation).

## Features

- User registration and login
- Personal dashboard per user
- Emergency contact management with email recipients
- Automatic account-email sync into emergency contacts
- Only one primary emergency email per user (enforced server-side)
- One-tap SOS trigger with:
  - Camera capture (`getUserMedia`)
  - Location capture (`navigator.geolocation`)
- SOS email alert with image attachment
- Google Maps location link included in alert
- SOS history list on dashboard
- History time displayed in the viewer's browser local timezone

## Tech Stack

- Python 3.11+
- Django 5.2
- PostgreSQL 15
- Docker + Docker Compose
- JavaScript (vanilla) frontend
- WhiteNoise for static assets

## Project Routes

- `/register/` - register new user
- `/login/` - login
- `/` - dashboard (auth required)
- `/send-sos` - SOS POST endpoint (auth required)

## Configuration

Environment variables are loaded from `.env` (if `python-dotenv` is available).

Key variables:

- `DJANGO_SECRET_KEY`
- `DEBUG`
- `ALLOWED_HOSTS`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST` (Docker default: `db`)
- `DB_PORT` (Docker default: `5432`)
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USE_TLS`
- `EMAIL_HOST_USER`
- `EMAIL_HOST_PASSWORD`
- `DEFAULT_FROM_EMAIL`

## Docker Run

1. Start the stack:

```bash
docker-compose up
```

2. In another terminal, run migrations inside the web container:

```bash
docker-compose exec web python manage.py migrate
```

3. Start the Django dev server inside the web container if needed:

```bash
docker-compose exec web python manage.py runserver 0.0.0.0:8000
```

4. Open the app:

- http://localhost:8000

5. Stop services:

```bash
docker-compose down
```

The application is configured to use the PostgreSQL service named `db` inside Docker, so no local PostgreSQL installation is required.

## Testing

With Docker setup (recommended):

```bash
docker-compose exec web python manage.py test alerts
```

If running tests inside the Docker stack, use:

```bash
docker-compose exec web python manage.py test alerts
```

## Gmail SMTP Setup

Use Gmail SMTP with App Password:

- `EMAIL_HOST=smtp.gmail.com`
- `EMAIL_PORT=587`
- `EMAIL_USE_TLS=True`
- `EMAIL_HOST_USER=youremail@gmail.com`
- `EMAIL_HOST_PASSWORD=<gmail-app-password>`

## Security Notes

- Dashboard and SOS endpoints require authentication.
- CSRF protection is enabled for forms and POST requests.
- Camera and geolocation require HTTPS in production.
