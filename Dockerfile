FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

RUN npm run prisma:generate && npm run build

EXPOSE 3000

CMD ["sh", "-c", "npm run prisma:push && npm run start"]
