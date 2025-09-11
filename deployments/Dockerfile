# Build
FROM node:24-alpine AS build-stage

WORKDIR /src

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Runtime
FROM nginx:alpine

COPY deployments/nginx.conf /etc/nginx/templates/app.conf.template

COPY --from=build-stage /src/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]