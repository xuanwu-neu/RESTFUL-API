#!/bin/bash
TMPFILE=offline$$.log
if [ -f .offline.pid ]; then
    echo "Found file .offline.pid. Not starting."
    exit 1
fi

npx serverless offline start 2>1 > $TMPFILE &
PID=$!
echo $PID > .offline.pid

while ! grep "server ready" $TMPFILE
do sleep 1; done

rm $TMPFILE
