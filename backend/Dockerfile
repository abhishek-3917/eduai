FROM node:18-slim

WORKDIR /app

COPY package*.json ./

# Install all dependencies (including devDependencies required for compilation)
RUN npm install

COPY . .

# Compile TypeScript
RUN npm run build

# Prune development dependencies to keep the image small
RUN npm prune --production

EXPOSE 5000

CMD ["node", "dist/app.js"]
