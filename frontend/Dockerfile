FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json .
RUN npm install

COPY . .

# Use development server (not production build) for live reload
EXPOSE 5173

CMD ["npm", "run", "dev"]
