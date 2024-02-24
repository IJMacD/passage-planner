#!/bin/sh

set -e

# Nginx needs to be able to read unix socket
usermod -aG www-data nginx

/usr/sbin/php-fpm8.2 -F &