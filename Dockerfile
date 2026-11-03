ARG SOURCE_REPO=https://github.com/openagri-eu/openagri-userdashboard

FROM node:22.17.1 AS builder
LABEL org.opencontainers.image.source=${SOURCE_REPO}

# set working directory
WORKDIR /app

# add node_modules/bin to path
ENV PATH /app/node_modules/.bin:$PATH

# install dependencies
COPY package.json /app/package.json
RUN npm install

COPY . /app

# build react app
RUN npm run build

# nginx
FROM nginx:alpine

RUN apk update && apk add nginx-module-image-filter

# put app on webserver
COPY nginx/nginx.conf /etc/nginx/templates/default.conf.template
COPY nginx/server.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist/ /src/www/app/
