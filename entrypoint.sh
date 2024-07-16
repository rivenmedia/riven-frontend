#!/bin/sh

# Default PUID and PGID to 1000 if not set
PUID=${PUID:-1001}
PGID=${PGID:-1001}

echo "Starting Container with $PUID:$PGID permissions..."

if [ "$PUID" = "0" ]; then
    echo "Running as root user"
    USER_HOME="/root"
    mkdir -p "$USER_HOME"
else
    # Validate PUID and PGID are integers
    if ! echo "$PUID" | grep -qE '^[0-9]+$'; then
        echo "PUID is not a valid integer. Exiting..."
        exit 1
    fi
    
    if ! echo "$PGID" | grep -qE '^[0-9]+$'; then
        echo "PGID is not a valid integer. Exiting..."
        exit 1
    fi
    
    # Default USERNAME and GROUPNAME if not set
    USERNAME=${USERNAME:-riven}
    GROUPNAME=${GROUPNAME:-riven}
    USER_HOME="/home/$USERNAME"
        
    # Create group if it doesn't exist
    if ! getent group "$PGID" > /dev/null; then
        addgroup -g "$PGID" "$GROUPNAME"
        if [ $? -ne 0 ]; then
            echo "Failed to create group. Exiting..."
            exit 1
        fi
    else
        GROUPNAME=$(getent group "$PGID" | cut -d: -f1)
    fi
    
    # Create user if it doesn't exist
    if ! getent passwd "$USERNAME" > /dev/null; then
        if getent passwd "$PUID" > /dev/null; then
            EXISTING_USER=$(getent passwd "$PUID" | cut -d: -f1)
            if [ "$EXISTING_USER" != "$USERNAME" ]; then
                echo "UID $PUID is already in use by $EXISTING_USER. Please choose a different UID."
                exit 1
            else
                echo "User $USERNAME already exists with UID $PUID."
            fi
        else
            adduser -D -h "$USER_HOME" -u "$PUID" -G "$GROUPNAME" "$USERNAME"
            if [ $? -ne 0 ]; then
                echo "Failed to create user. Exiting..."
                exit 1
            fi
        fi
    else
        if [ "$PUID" -ne 0 ]; then
            echo "User modification not supported in this script for Alpine. Please ensure correct PUID/PGID beforehand."
        fi
    fi
    
    mkdir -p "$USER_HOME"
    chown -R "$PUID:$PGID" "$USER_HOME"
fi

umask 002

export XDG_CONFIG_HOME="$USER_HOME/.config"
export XDG_DATA_HOME="$USER_HOME/.local/share"
export HOME="$USER_HOME"

: ${ORIGIN:="http://localhost:3000"}
: ${BACKEND_URL:="http://127.0.0.1"}

# Start the frontend
echo "Starting frontend..."
exec su -m $USERNAME -c "ORIGIN=$ORIGIN BACKEND_URL=$BACKEND_URL node /riven/build"