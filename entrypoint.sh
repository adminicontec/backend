#!/bin/bash

# Start cron service
service cron start

# Tail the cron log file
tail -f /uploads/cron.log &

# Start Node.js application
exec "$@"
