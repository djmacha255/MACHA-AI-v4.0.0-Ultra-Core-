FROM node:20-slim

# Sakinisha FFmpeg na zana za picha (WebP) zinazohitajika na WhatsApp Bot
RUN apt-get update && apt-get install -y \
    ffmpeg \
    webp \
    git \
    && rm -rf /var/lib/apt/lists/*

# Tengeneza folda la mradi ndani ya container
WORKDIR /usr/src/app

# Nakili maelezo ya maktaba
COPY package*.json ./

# Sakinisha dependencies zote
RUN npm install

# Nakili kodi zote za mradi kwenda kwenye container
COPY . .

# Fungua mlango wa Web Panel (Port)
EXPOSE 3000

# Amri ya kuwasha bot rasmi
CMD ["node", "server.js"]
