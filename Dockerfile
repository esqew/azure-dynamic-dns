FROM node:18-alpine3.17
ENTRYPOINT [ "node" ]
WORKDIR /usr/src/azure-dynamic-dns
COPY package*.json ./
RUN npm update -g npm
RUN npm install
COPY . .
CMD [ "dns-daemon.js", "--trace-uncaught" ]