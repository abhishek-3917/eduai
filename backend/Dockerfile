FROM node:18-slim

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production

# Install TypeScript dependencies to compile, which will be cleaned up/ignored in execution
RUN npm install -g typescript ts-node

COPY . .

RUN npm run build

EXPOSE 5000

CMD ["node", "dist/app.js"]
