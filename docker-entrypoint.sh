#!/bin/sh
if [ -z "$ORIGIN" ]; then
    echo "ORIGIN is not set"
    export PROTOCOL_HEADER=x-forwarded-proto
    export HOST_HEADER=x-forwarded-host
else
    export ORIGIN=${ORIGIN}
fi

export BACKEND_URL=${BACKEND_URL}
exec "$@"