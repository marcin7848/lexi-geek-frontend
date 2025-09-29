FROM node:20 AS builder

COPY . /app/
WORKDIR /app
RUN npm install
RUN npm run build --prod

FROM nginx:1.27.0-alpine

COPY --from=builder /app/dist/lexigeek-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
