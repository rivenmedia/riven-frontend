#!/bin/sh
: ${ORIGIN:="http://localhost:3000"}
: ${BACKEND_URL:="http://127.0.0.1"}

export ORIGIN
export BACKEND_URL

exec node /riven/build