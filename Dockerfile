FROM node:lts-alpine as base
WORKDIR /usr/src/app
COPY package*.json ./


FROM base as test
RUN npm install
COPY . .
EXPOSE 8080
CMD [ "npm", "test" ]


FROM base as prod
RUN npm install
COPY . .
EXPOSE 8080
CMD [ "npm", "start" ]