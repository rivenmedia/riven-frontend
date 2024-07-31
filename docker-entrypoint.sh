#!/bin/sh
# Export the ORIGIN and BACKEND_URL environment variables
export ORIGIN=${ORIGIN}
export BACKEND_URL=${BACKEND_URL}
export DIALECT=${DIALECT}
export DATABASE_URL=${DATABASE_URL}

# Execute the command provided to the script
exec "$@"