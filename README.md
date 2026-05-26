# AlertX - SOS Emergency Alert System (Django + PostgreSQL) — AWS & DevOps

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
- PostgreSQL 15 (consider Amazon RDS for managed DB hosting)
- JavaScript (vanilla) frontend
- WhiteNoise for static assets
- AWS deployment: EC2 (application hosts), Amazon ECR (container registry) and optionally EKS for container orchestration
- CI/CD and build: AWS CodePipeline / CodeBuild (or other Git provider CI)
- Monitoring & logging: Amazon CloudWatch (central logs, metrics, alarms)
 - WhiteNoise for static assets
 - DevOps & IaC: Terraform / CloudFormation, CI/CD pipelines, image builds and automated deployments
 - AWS deployment: EC2 (application hosts), Amazon ECR (container registry) and optionally EKS for container orchestration
 - CI/CD and build: AWS CodePipeline / CodeBuild (or other Git provider CI)
 - Monitoring & logging: Amazon CloudWatch (central logs, metrics, alarms)

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
- `DB_HOST`
- `DB_PORT`
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USE_TLS`
- `EMAIL_HOST_USER`
- `EMAIL_HOST_PASSWORD`
- `DEFAULT_FROM_EMAIL`

## Local development

Create and activate a virtual environment, install dependencies, run migrations, and start the dev server:

```bash
python -m venv .venv
.venv\Scripts\activate       # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Run tests locally with:

```bash
python manage.py test alerts
```

## Deployment (AWS - high level)

This repository can be deployed to AWS in two common ways depending on your needs:

- EC2 (traditional VM hosts):
  - Provision EC2 instances (or an Auto Scaling Group).
  - Install Python, create a virtualenv, and run the app under `gunicorn` managed by `systemd`.
  - Use Nginx as a reverse proxy/static file server.
  - Store static/media in S3 and use RDS for a managed PostgreSQL instance.

- EKS (containerized workloads, optional):
  - Build a Docker image locally or in CI and push it to Amazon ECR.
  - Deploy to an EKS cluster using Kubernetes manifests (if you prefer container orchestration).

Notes:

- Use IAM roles for EC2/EKS to grant least-privilege access to S3, RDS, ECR, and CloudWatch.
- Store secrets in AWS Systems Manager Parameter Store or AWS Secrets Manager and reference them at runtime.

## CI/CD (recommended)

Prefer AWS-native CI/CD or your existing Git provider workflows:

- AWS CodeBuild + CodePipeline: build, test, push images to ECR, and deploy to EC2/EKS.
- Alternatively, use GitHub Actions, GitLab CI, or another CI that pushes artifacts to ECR and triggers deployment.

### EC2 deployment walkthrough (concise)

- Provision an EC2 instance (Amazon Linux 2 / Ubuntu) and attach an IAM role with S3/RDS/SSM permissions.
- SSH into the instance or use Session Manager, then install system packages and Python:

```bash
sudo apt update && sudo apt install -y python3-venv python3-pip nginx git
git clone <repo-url> /srv/alertx
cd /srv/alertx
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
```

- Create a `systemd` service for `gunicorn` (example ` /etc/systemd/system/alertx.service`):

```ini
[Unit]
Description=AlertX gunicorn
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/srv/alertx
Environment="DJANGO_SETTINGS_MODULE=sos_project.settings"
ExecStart=/srv/alertx/.venv/bin/gunicorn sos_project.wsgi:application -w 3 -b 127.0.0.1:8000

[Install]
WantedBy=multi-user.target
```

- Configure Nginx to reverse-proxy and serve static files, then enable service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now alertx
sudo systemctl restart nginx
```

- Use S3 for static/media and RDS for PostgreSQL in production; use IAM role for S3 access.

### Sample CodeBuild buildspec (Docker build + push to ECR)

Use this `buildspec.yml` in your source root for CodeBuild builds that produce a Docker image pushed to ECR:

```yaml
version: 0.2
env:
  variables:
    IMAGE_REPO_NAME: alertx
phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws --version
      - $(aws ecr get-login --no-include-email --region $AWS_DEFAULT_REGION)
      - REPO_URI=$(aws ecr describe-repositories --repository-names $IMAGE_REPO_NAME --region $AWS_DEFAULT_REGION --query 'repositories[0].repositoryUri' --output text)
  build:
    commands:
      - echo Building the Docker image...
      - docker build -t $IMAGE_REPO_NAME:latest .
      - docker tag $IMAGE_REPO_NAME:latest $REPO_URI:latest
  post_build:
    commands:
      - echo Pushing the Docker image...
      - docker push $REPO_URI:latest
      - printf '[{"name":"container","imageUri":"%s"}]' $REPO_URI:latest > imagedefinitions.json
artifacts:
  files: imagedefinitions.json
```

### CodePipeline flow (high level)

- Source: GitHub/Git provider
- Build: CodeBuild (runs tests, builds Docker image, pushes to ECR)
- Deploy: either
  - Deploy to EKS (apply new manifests / update image tags), or
  - Deploy to EC2 (use SSM Run Command to pull and restart service) or use CodeDeploy for blue/green deployments.

### Jenkins

- A Jenkins pipeline is available via `Jenkinsfile` at the repo root; it can build, test, and deploy similarly to CodeBuild.
- Typical Jenkins stages: Checkout → Install deps → Run tests → Build image → Push to ECR → Deploy (EKS/EC2).

### Monitoring: Prometheus & Grafana + CloudWatch

- Application metrics: expose Prometheus metrics in Django using `django-prometheus` or `prometheus_client` on `/metrics`.
- Prometheus scrape example (prometheus.yml):

```yaml
scrape_configs:
  - job_name: 'alertx'
    static_configs:
      - targets: ['<alertx-host>:8000']
    metrics_path: /metrics
```

- Grafana dashboards: create panels for request rate, error rate (5xx), latency percentiles, CPU/memory, DB connections, and S3/RDS metrics.
- Alerting: configure alerts for high error rates, increased latency, or low disk space.
- CloudWatch integration: if running on AWS, ship logs/metrics to CloudWatch and optionally use the CloudWatch agent or the Prometheus to CloudWatch exporter.

## Where Jenkins/Grafana/Prometheus are mentioned

- Jenkins pipeline: see `Jenkinsfile` in the repository root for a CI/CD example.
- Grafana & Prometheus: these are supported options for metrics collection and dashboarding; prefer CloudWatch in purely AWS-managed stacks or run Prometheus/Grafana in EKS/EC2 if you need full control.


## Monitoring & Logging

- Use Amazon CloudWatch Logs for application logs and CloudWatch Metrics for key performance indicators.
- Configure CloudWatch Alarms for error rates, high CPU/memory, or other operational thresholds.
- For tracing, consider AWS X-Ray or third-party APM tools.

## Gmail SMTP Setup

Use Gmail SMTP with App Password if you send email through Gmail:

- `EMAIL_HOST=smtp.gmail.com`
- `EMAIL_PORT=587`
- `EMAIL_USE_TLS=True`
- `EMAIL_HOST_USER=youremail@gmail.com`
- `EMAIL_HOST_PASSWORD=<gmail-app-password>`

## Security Notes

- Dashboard and SOS endpoints require authentication.
- CSRF protection is enabled for forms and POST requests.
- Camera and geolocation require HTTPS in production.

If you want, I can add a short EC2 deployment walkthrough or an EKS/ECR CI pipeline example next.
