#!/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
$SERVER=
$REMOTE_DIR=/var/www/html

rsync -av --exclude-from=deploy-exclude.txt $SCRIPT_DIR/ $SERVER:$REMOTE_DIR