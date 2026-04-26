FROM node:20-alpine

WORKDIR /app

# Copy package files first
COPY package.json package-lock.json* ./

RUN npm install

COPY . .

# Expose Vite's default port
EXPOSE 5173

# Run Vite dev server (host 0.0.0.0 is needed for Docker port mapping to work)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
