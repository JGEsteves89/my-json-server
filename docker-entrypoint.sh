#!/bin/sh
set -e

# If /usr/src/app/data exists, fix its ownership to match the host
if [ -d /usr/src/app/data ]; then
  HOST_UID=$(stat -c '%u' /usr/src/app/data)
  HOST_GID=$(stat -c '%g' /usr/src/app/data)

  # If UID/GID differ, modify the container user
  if [ "$HOST_UID" != "$(id -u app)" ] || [ "$HOST_GID" != "$(id -g app)" ]; then
    echo "Adjusting app user UID/GID to match host: $HOST_UID:$HOST_GID"
    # Delete and recreate app user with matching UID/GID
    deluser app || true
    addgroup -g "$HOST_GID" app || true
    adduser -u "$HOST_UID" -G app -D app || true
  fi
fi

# Make sure data directory is writable
chmod -R u+rwX /usr/src/app/data

# Execute the original command
exec "$@"
