FROM node:21 AS build
WORKDIR /app
COPY package.json yarn.lock /app/
RUN ["yarn", "install", "--frozen-lockfile"]
COPY . /app/
RUN ["yarn", "build"]

FROM nginx:1.25.4 AS final
RUN apt-get update && apt-get install -y \
    php8.2-curl \
    php8.2-fpm \
    && rm -rf /var/lib/apt/lists/*
COPY 50-start-php-fpm.sh /docker-entrypoint.d/
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN ["mkdir", "-p", "/var/run/nginx/cache"]
COPY --from=build /app/dist/ /usr/share/nginx/html/
COPY server/weather_forecast.php /usr/share/nginx/html/