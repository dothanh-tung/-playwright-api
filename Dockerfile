FROM mcr.microsoft.com/playwright:v1.42.1-jammy

WORKDIR /app
COPY app/package*.json ./
RUN npm install
COPY app .
CMD ["node", "index.js"]
