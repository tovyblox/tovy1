FROM node:lts

WORKDIR /usr/app

COPY . .

RUN npm install

CMD ["npm", "start"]
