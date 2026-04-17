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

## Docker Run (Recommended)

1. Build and start services:

```bash
docker-compose up -d --build
```

2. Run migrations:

```bash
docker-compose exec web python manage.py migrate
```

3. Create admin user (optional):

```bash
docker-compose exec web python manage.py createsuperuser
```

4. Open app:

- http://localhost:8000

5. Stop services:

```bash
docker-compose down
```

## Local Non-Docker Run

If you run Django directly on host (`python manage.py runserver`), set DB host/port for host networking:

- `DB_HOST=localhost`
- `DB_PORT=5432`

Then run:

```bash
python manage.py migrate
python manage.py runserver
```

## Testing

With Docker setup (recommended):

```bash
docker-compose exec web python manage.py test alerts
```

If running tests on host machine, ensure `DB_HOST` is resolvable from host (for example `localhost`, not `db`).

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
