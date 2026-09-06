#!/bin/sh
set -e

# =========================================================================
# TALENT ALIGN BACKEND DOCKER ENTRYPOINT
# =========================================================================

echo "========================================================"
echo " Starting Talent Align Backend Service..."
echo "========================================================"

# Check if PostgreSQL is used and wait for it to be ready
if [ "$DB_ENGINE" = "django.db.backends.postgresql" ] || [ -n "$DB_HOST" ] && [ "$DB_HOST" != "localhost" ]; then
    echo "Waiting for PostgreSQL database at $DB_HOST:${DB_PORT:-5432}..."
    
    while ! nc -z "$DB_HOST" "${DB_PORT:-5432}"; do
        sleep 1
    done
    
    echo "PostgreSQL is ready and accepting connections!"
fi

# Run database migrations
echo "Applying database migrations..."
python manage.py migrate --noinput

# Collect static files if in production mode
if [ "$DEBUG" = "False" ] || [ "$DEBUG" = "false" ] || [ "$DEBUG" = "0" ]; then
    echo "Collecting static files..."
    python manage.py collectstatic --noinput --clear || true
fi

echo "Backend initialization complete. Executing command: $@"
echo "========================================================"

exec "$@"
