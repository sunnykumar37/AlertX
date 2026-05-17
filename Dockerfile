FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt /app/

RUN pip install --no-cache-dir --default-timeout=120 --retries=10 -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "until python manage.py migrate; do echo 'Waiting for database...'; sleep 2; done; python manage.py runserver 0.0.0.0:8000"]