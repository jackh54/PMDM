FROM node:22-alpine AS base
WORKDIR /app

RUN apk add --no-cache curl

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY src ./src

RUN mkdir -p /app/data && chown -R node:node /app

USER node

EXPOSE 3001
CMD ["npm", "start"]
