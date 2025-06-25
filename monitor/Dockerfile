FROM python:3.9

WORKDIR /app

RUN pip install gunicorn==20.1.0 uvicorn==0.22.0

COPY requirements.txt .

RUN pip install -r requirements.txt --no-cache-dir

COPY . .

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "monitor.asgi:application", "-k", "uvicorn.workers.UvicornWorker"]