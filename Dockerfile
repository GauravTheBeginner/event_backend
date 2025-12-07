FROM node:20.9.0-slim

# Install system dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxi6 \
    libxtst6 \
    libcups2 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including Puppeteer
RUN npm install

# Install Chromium for Puppeteer
RUN npx puppeteer browsers install chrome

# Copy application code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 3000

# Copy start script
COPY start.sh .
RUN chmod +x start.sh

CMD ["./start.sh"]
