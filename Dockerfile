# Optional Dockerfile to ensure build tools are available for native modules
FROM node:18-bullseye-slim

# Install python & build tools required by node-gyp
RUN apt-get update \
  && apt-get install -y python3 make g++ build-essential python3-dev pkg-config \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies from package-lock / package.json
COPY package*.json ./
RUN npm ci --omit=dev

# Copy app sources
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
