FROM node:24.9.0 AS builder

COPY package*.json ./
RUN npm install
COPY . .
RUN npx vite build

FROM nginx:1.29.1

COPY --from=builder dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
