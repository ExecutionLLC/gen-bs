#!/bin/bash
export PORT=8888
export AS_HOST=192.168.1.101
until node index.js; do
	notify-send "Server crashed with exit code $?.  Respawning.." >&2
	sleep 1
done
