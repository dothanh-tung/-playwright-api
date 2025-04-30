FROM mcr.microsoft.com/playwright:latest

WORKDIR /app
COPY server.js .
RUN npm init -y && npm install express @playwright/test playwright-extra express-rate-limit

ENV NODE_ENV=development
ENV TZ=Asia/Bangkok

CMD ["node", "server.js"]