#!/bin/sh
: ${ORIGIN:="http://localhost:3000"}
: ${BACKEND_URL:="http://127.0.0.1"}

exec ORIGIN=$ORIGIN BACKEND_URL=$BACKEND_URL node /riven/build