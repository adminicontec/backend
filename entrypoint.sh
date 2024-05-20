#!/bin/bash

# Start cron service
service cron start

# Tail the cron log file
tail -f /var/log/cron.log &

# Start Node.js application
node ./src/app/server.js  # Replace with the name of your main server file
