#!/bin/bash

# Setting the cronjob
cron_filepath = "/var/spool/cron/crontab/"
if ! grep -q "store.json" "$cron_filepath"; then (crontab -l; echo "0 * * * * rm -rf /root/wabot/database/store.json /root/wabot/database/db.json") | crontab; fi
