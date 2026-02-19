# Build
FROM oven/bun:alpine AS build-stage

WORKDIR /src

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

# Runtime
FROM nginx:alpine

RUN apk add --no-cache jq

COPY deployments/nginx.conf /etc/nginx/templates/app.conf.template
COPY deployments/generate-runtime-config.sh /docker-entrypoint.d/99-generate-runtime-config.sh
COPY --from=build-stage /src/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]