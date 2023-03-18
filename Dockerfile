FROM node:18-alpine3.17
ENTRYPOINT [ "node" ]
WORKDIR /app
COPY ./config ./
COPY package*.json ./
RUN npm update -g npm
RUN npm install
COPY . .
CMD [ "dns-daemon.js", "--trace-uncaught" ]