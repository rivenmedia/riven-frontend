#!/bin/sh

export PROTOCOL_HEADER=x-forwarded-proto
export HOST_HEADER=x-forwarded-host

if [ -z "$ORIGIN" ]; then
    PORT=${PORT:-3000}
    export ORIGIN="http://localhost:${PORT}"
    echo "ORIGIN not set, defaulting to ${ORIGIN}"
else
    export ORIGIN="${ORIGIN}"
fi

export PORT=${PORT:-3000}

exec "$@"
