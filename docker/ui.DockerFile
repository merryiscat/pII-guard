FROM node:22-alpine AS ui-builder
ARG VITE_PII_DETECTOR_API_ENDPOINT
ENV VITE_PII_DETECTOR_API_ENDPOINT=$VITE_PII_DETECTOR_API_ENDPOINT
RUN mkdir -p /app/
WORKDIR /app/
COPY ./ui /app/
RUN npm install
RUN npm run build

FROM nginx:alpine AS pii-detector-ui
RUN mkdir -p /app/
COPY --from=ui-builder /app/dist /usr/share/nginx/html
COPY ./docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
