FROM node:18
WORKDIR /usr/src/app
# Copy package files first to leverage Docker cache
COPY package*.json ./
RUN npm install
# Copy the rest of your root files
COPY . .
EXPOSE 3000
# Updated to point to your actual entry file
CMD ["node", "index.js"]