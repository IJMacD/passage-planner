FROM node:24.14 AS build
RUN git clone https://github.com/IJMacD/passage-planner.git /app && \
    cd /app && \
    git checkout b27e16227e988510cbaf4b9f900c1575775a1077
WORKDIR /app/passage-planner
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn,uid=1000,gid=1000 yarn && yarn build:library

FROM php:8.3-apache AS final
RUN ["a2enmod","rewrite"]
RUN ["docker-php-ext-install", "calendar", "pdo_mysql"]
COPY src /var/www/html/
COPY --from=build /app/passage-planner/dist/ /var/www/html/static/vendor/