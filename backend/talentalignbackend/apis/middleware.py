import time
import uuid
import logging
from django.utils.deprecation import MiddlewareMixin

request_logger = logging.getLogger('talentalign.requests')
app_logger = logging.getLogger('apis')


def get_client_ip(request):
    """Extract real client IP address from proxy headers or remote address."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        # If multiple IPs are forwarded, the first is the client
        return x_forwarded_for.split(',')[0].strip()
    x_real_ip = request.META.get('HTTP_X_REAL_IP')
    if x_real_ip:
        return x_real_ip.strip()
    return request.META.get('REMOTE_ADDR', '127.0.0.1')


class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Production-grade request logging middleware for containerized Talent Align backend.
    Tracks every incoming HTTP request, execution latency (ms), user identity, IP,
    and captures unhandled exceptions with full tracebacks.
    """

    def process_request(self, request):
        request.start_time = time.perf_counter()
        request.request_id = request.headers.get('X-Request-ID', str(uuid.uuid4())[:8])

    def process_response(self, request, response):
        # Calculate execution duration
        start_time = getattr(request, 'start_time', None)
        if start_time is not None:
            duration_ms = (time.perf_counter() - start_time) * 1000.0
        else:
            duration_ms = 0.0

        request_id = getattr(request, 'request_id', 'unknown')
        ip = get_client_ip(request)
        method = request.method
        path = request.get_full_path()
        status_code = response.status_code

        # Determine user identity safely
        user = 'Anonymous'
        if hasattr(request, 'user') and request.user.is_authenticated:
            user = getattr(request.user, 'username', str(request.user.pk))

        # Add Request-ID header to response
        response['X-Request-ID'] = request_id

        # Log format
        log_msg = (
            f"[HTTP] req_id={request_id} method={method} path={path} "
            f"status={status_code} duration={duration_ms:.2f}ms ip={ip} user={user}"
        )

        if status_code >= 500:
            request_logger.error(log_msg)
        elif status_code >= 400:
            request_logger.warning(log_msg)
        else:
            request_logger.info(log_msg)

        return response

    def process_exception(self, request, exception):
        request_id = getattr(request, 'request_id', 'unknown')
        ip = get_client_ip(request)
        method = request.method
        path = request.get_full_path()

        app_logger.error(
            f"[EXCEPTION] req_id={request_id} method={method} path={path} ip={ip} error={str(exception)}",
            exc_info=True
        )
        return None
