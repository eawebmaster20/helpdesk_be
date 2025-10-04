FROM node:18-alpine
WORKDIR /app

# Copy package.json and install production deps
COPY package*.json ./
RUN npm ci --only=production

# Copy pre-built dist
COPY ./dist ./dist

RUN mkdir -p ./dist/db && chmod 755 ./dist/db

COPY ./src/db/schema.sql ./dist/db/schema.sql

EXPOSE 3000
CMD ["node", "dist/index.js"]