FROM node:20.17

WORKDIR /home/node/app

COPY package.json .
COPY yarn.lock .
COPY /prisma ./prisma

RUN yarn
RUN yarn prisma generate

COPY /build ./build

ENV PORT 8080

EXPOSE 8080
CMD ["yarn", "start"]
