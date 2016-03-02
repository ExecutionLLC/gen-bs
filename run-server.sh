#!/bin/bash
export GEN_WS_PORT=8888
export GEN_WS_AS_HOST=192.168.1.101
export GEN_WS_ENABLE_AUTH_CALLBACK_PORTS=true
export GEN_WS_DISABLE_MAKE_ANALYZED=true
export GEN_WS_ENABLE_FULL_RIGHTS_FOR_DEMO_USERS=true
until node index.js; do
	notify-send "Server crashed with exit code $?.  Respawning.." >&2
	sleep 1
done
