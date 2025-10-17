#!/bin/sh

export PROTOCOL_HEADER=x-forwarded-proto
export HOST_HEADER=x-forwarded-host

if [ -z "$ORIGIN" ]; then
    echo "ORIGIN is not set"
else
    export ORIGIN=${ORIGIN}
fi

exec "$@"