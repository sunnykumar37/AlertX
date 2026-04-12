# AlertX - SOS Emergency Alert System (Django + PostgreSQL)

SOS Emergency Alert System built with Django backend and HTML/CSS/JavaScript frontend.

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

## Deployment Note

Render-specific files were removed because this project is currently intended for local/PostgreSQL usage only.

You can still deploy later to any platform by adding platform-specific config files when needed.

## Docker & Cloud Deployment

This project is designed to be containerized and deployed to cloud platforms:

### Containerization

When ready, create `Dockerfile` and `docker-compose.yml` for:
- Multi-stage Docker build (builder + runtime)
- PostgreSQL service container
- Django application service
- Environment variable support via `.env` file

### Supported Cloud Platforms

Deploy to any of the following:

- **AWS** (ECS, App Runner, or EC2)
- **Azure** (Container Instances, App Service, or AKS)
- **Google Cloud** (Cloud Run or App Engine)
- **DigitalOcean** (App Platform or Docker registry)
- **Heroku** (alternative after Render)
- **Any Docker-compatible platform**

### Pre-Deployment Checklist

Before containerizing:
- ✅ `requirements.txt` includes all dependencies
- ✅ `.env` file excluded via `.gitignore`
- ✅ PostgreSQL connectivity tested locally
- ✅ Gmail SMTP credentials secured
- ✅ Static files collectible via WhiteNoise

### Deployment Steps (When Ready)

1. Create `Dockerfile` with multi-stage build
2. Create `docker-compose.yml` for local testing
3. Create platform-specific deployment config (CloudFormation, ARM template, etc.)
4. Build and test Docker image locally
5. Push to container registry (Docker Hub, ECR, ACR, etc.)
6. Deploy to chosen cloud platform

## App Routes

- `/register/` - user registration
- `/login/` - login
- `/` - dashboard (login required)
- `/send-sos` - SOS POST endpoint (login required)

## Security

- Auth-protected dashboard and SOS endpoint
- CSRF token for form/AJAX requests
- HTTPS required in production for camera and geolocation permissions
