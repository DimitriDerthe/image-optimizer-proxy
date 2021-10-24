FROM node:14-alpine

WORKDIR /app

COPY ./package.json ./
COPY ./yarn.lock ./

RUN npm install pm2 uglify-js -g

RUN yarn install

COPY . .

ENV ORIGIN="https://cdn.pixabay.com"

EXPOSE 8080

RUN uglifyjs --compress --mangle --output index.js -- index.js

CMD ["pm2-runtime", "index.js"]