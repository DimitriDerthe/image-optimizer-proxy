FROM node:14-alpine

WORKDIR /app

COPY ./package.json ./
COPY ./yarn.lock ./

RUN npm install pm2 -g

RUN yarn install

COPY . .

ENV ORIGIN="https://cdn.pixabay.com"

EXPOSE 8080

CMD ["pm2-runtime", "index.js"]