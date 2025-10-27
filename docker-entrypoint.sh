#!/bin/sh
set -e

# If /usr/src/app/data is empty, optionally seed it
if [ -d /usr/src/app/data ]; then
  if [ -z "$(ls -A /usr/src/app/data)" ]; then
    echo "Data directory is empty, initializing..."
    # Optional: copy default data here
    # cp -r /usr/src/app/default-data/* /usr/src/app/data/
  fi
fi

# Make sure the data directory is writable by the container user
chmod -R u+rwX /usr/src/app/data

# Execute the original command
exec "$@"
