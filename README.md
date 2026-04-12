# SOS Emergency Alert System (Django + PostgreSQL)

Production-ready SOS Emergency Alert System built with Django backend and HTML/CSS/JavaScript frontend.

## Features

- User registration/login using Django built-in authentication
- Personal dashboard per user
- One-tap SOS trigger with:
  - Front camera capture (`getUserMedia`)
  - Live location (`navigator.geolocation`)
- Backend endpoint: `/send-sos`
- Google Maps link generation (no API key)
- Email alert via `EmailMessage` with image attachment
- SOS alert history on dashboard
- Emergency email management (supports multiple contacts)
- CSRF-safe AJAX request

## Tech Stack

- Python 3.11+
- Django 5.2
- PostgreSQL (configured on **port 5433**)
- `psycopg2-binary`
- Gunicorn + WhiteNoise for production

## Database Requirement

The project is configured for PostgreSQL with custom port `5433`:

- ENGINE: `django.db.backends.postgresql`
- HOST: set via `DB_HOST` environment variable
- PORT: `5433`

If your actual PostgreSQL host is named `postgres18`, set `DB_HOST=postgres18` in your environment. For local development, `localhost` is the default.

Environment variables control DB credentials.

## Local Setup

1. Create and activate virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Copy environment template:

```bash
cp .env.example .env
```

On Windows PowerShell, set variables from `.env` or export manually.

4. Set required environment variables:

- `DJANGO_SECRET_KEY`
- `DEBUG`
- `ALLOWED_HOSTS`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_PORT=5433`
- `EMAIL_HOST_USER`
- `EMAIL_HOST_PASSWORD` (Gmail App Password)

5. Run migrations:

```bash
python manage.py makemigrations
python manage.py migrate
```

6. Create admin user (optional):

```bash
python manage.py createsuperuser
```

7. Start server:

```bash
python manage.py runserver
```

## Gmail SMTP Setup

Use Gmail SMTP with App Password:

- `EMAIL_HOST=smtp.gmail.com`
- `EMAIL_PORT=587`
- `EMAIL_USE_TLS=True`
- `EMAIL_HOST_USER=youremail@gmail.com`
- `EMAIL_HOST_PASSWORD=<gmail-app-password>`

## Render Deployment (Free Tier)

This repo includes:

- `render.yaml`
- `Procfile`
- `build.sh`

### Steps

1. Push project to GitHub.
2. Create a new Render Blueprint deployment from repo.
3. Ensure environment variables are set (especially email settings and hosts).
4. Deploy.

## Important Note About PostgreSQL Port 5433 on Render

This project enforces `DB_PORT=5433` by default. If your managed Render PostgreSQL instance uses a different port, either:

- Provide a PostgreSQL instance that listens on 5433, or
- Override `DB_PORT` in Render environment variables to the assigned port.

## App Routes

- `/register/` - user registration
- `/login/` - login
- `/` - dashboard (login required)
- `/send-sos` - SOS POST endpoint (login required)

## Security

- Auth-protected dashboard and SOS endpoint
- CSRF token for form/AJAX requests
- Secure cookie + SSL redirects when `RENDER=true`
