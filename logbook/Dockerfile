FROM node:20 as build
WORKDIR /app
RUN ["git", "clone", "https://github.com/IJMacD/passage-planner.git", "/app"]
RUN yarn && yarn build:library

FROM php:8.3-apache
RUN ["docker-php-ext-install", "pdo_mysql"]
RUN ["a2enmod","rewrite"]
COPY src /var/www/html/
COPY --from=build /app/dist /var/www/html/static/vendor