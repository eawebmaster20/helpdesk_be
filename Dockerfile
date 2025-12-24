FROM node:alpine
WORKDIR /app

# Copy package.json and install production deps
COPY package*.json ./
RUN npm ci --only=production

# Copy pre-built dist
# COPY schema.sql ./dist/db/schema.sql
COPY ./dist ./dist
COPY .env ./.env

EXPOSE 5000
CMD ["node", "dist/index.js"]