FROM node:20-alpine AS builder

RUN apk add --no-cache openssl libc6-compat

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY prisma/ ./prisma/
RUN npx prisma generate

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build
RUN npx tsc prisma/seed.ts --outDir dist/prisma --module commonjs --target es2020 --esModuleInterop

# Production image run stage
FROM node:20-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/prisma ./prisma

EXPOSE 3001

ENV NODE_ENV=production

CMD ["npm", "start"]
