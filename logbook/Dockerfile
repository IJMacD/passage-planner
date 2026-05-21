FROM node:24.14 AS build
RUN git clone https://github.com/IJMacD/passage-planner.git /app && \
    cd /app && \
    git checkout ba8d43e1fd3b61a8cb3d64cf99a6d2e72b3ad716
WORKDIR /app/passage-planner
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn,uid=1000,gid=1000 yarn && yarn build:library

FROM php:8.3-apache AS final
RUN ["a2enmod","rewrite"]
RUN ["docker-php-ext-install", "calendar", "pdo_mysql"]
COPY src /var/www/html/
COPY --from=build /app/passage-planner/dist/ /var/www/html/static/vendor/