FROM node:16
ENTRYPOINT [ "node" ]
WORKDIR /usr/src/azure-dynamic-dns
COPY package*.json ./
RUN npm install
COPY . .
CMD [ "dns-daemon.js" ]