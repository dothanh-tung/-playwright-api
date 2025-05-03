FROM node:20-slim

# Cài đặt Google Chrome với cách thêm GPG key hiện đại
RUN apt-get update && apt-get install -y \
    wget gnupg ca-certificates \
    && wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
    && apt-get update && apt-get install -y google-chrome-stable \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY server.js .
RUN npm init -y && npm install puppeteer@latest puppeteer-extra puppeteer-extra-plugin-stealth express-rate-limit express cheerio

ENV NODE_ENV=development
ENV TZ=Asia/Bangkok

CMD ["node", "server.js"]