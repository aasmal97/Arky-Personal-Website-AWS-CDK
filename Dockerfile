# Use an Linux image as the base
# FROM ubuntu:latest
FROM node:22
# Set the working directory
WORKDIR /app
COPY --chown=app:app . /app
COPY package.json ./app/package.json

# Install all dependencies
RUN npm i
CMD ["npm", "run", "watch"]
