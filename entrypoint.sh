#!/bin/bash

# Start cron service
service cron start

# Tail the cron log file
tail -f /var/log/cron.log &

# Start Node.js application
exec "$@"
