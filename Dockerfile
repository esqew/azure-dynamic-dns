FROM node:16
WORKDIR /usr/src/azure-dynamic-dns
COPY package*.json ./
RUN npm install
COPY . .
CMD [ "node", "dns-daemon.js" ]