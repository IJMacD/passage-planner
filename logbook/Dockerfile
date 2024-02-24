FROM node:21 as build
RUN ["git", "clone", "https://github.com/IJMacD/passage-planner.git", "/app"]
WORKDIR /app/passage-planner
RUN yarn && yarn build:library

FROM php:8.3-apache
RUN ["docker-php-ext-install", "pdo_mysql"]
RUN ["a2enmod","rewrite"]
COPY src /var/www/html/
COPY --from=build /app/dist/ /var/www/html/static/vendor/