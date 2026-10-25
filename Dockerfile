FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
RUN mkdir -p /app/logs
EXPOSE 8000
CMD ["node", "--import", "tsx/esm", "server.ts"]
