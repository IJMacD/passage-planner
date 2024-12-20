FROM node:21 AS build
RUN ["git", "clone", "https://github.com/IJMacD/passage-planner.git", "/app"]
WORKDIR /app/passage-planner
RUN yarn && yarn build:library

FROM php:8.3-apache AS final
RUN ["a2enmod","rewrite"]
RUN ["docker-php-ext-install", "calendar", "pdo_mysql"]
COPY src /var/www/html/
COPY --from=build /app/passage-planner/dist/ /var/www/html/static/vendor/