#!/bin/bash

# Setting the cronjob
if ! crontab -l | grep -q "store.json"; then
    (crontab -l; echo "0 * * * * rm -rf /root/wabot/database/store.json /root/wabot/database/db.json") | crontab -
fi
