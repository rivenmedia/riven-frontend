#!/bin/sh

export PROTOCOL_HEADER=x-forwarded-proto
export HOST_HEADER=x-forwarded-host

if [ -z "$BETTER_AUTH_URL" ]; then
    echo "ORIGIN is not set"
else
    export ORIGIN=${BETTER_AUTH_URL}
fi


exec "$@"