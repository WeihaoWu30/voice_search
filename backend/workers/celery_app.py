import ssl
from celery import Celery
from core.config import settings

celery_app = Celery(
    "path_of_vo",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["workers.tasks"],
)

celery_app.conf.broker_use_ssl = {"ssl_cert_reqs": ssl.CERT_NONE}
celery_app.conf.redis_backend_use_ssl = {"ssl_cert_reqs": ssl.CERT_NONE}
celery_app.conf.worker_pool = "threads"
