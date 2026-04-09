# Build
FROM oven/bun:alpine AS build-stage

WORKDIR /src

COPY package.json bun.lock ./

RUN bun install

COPY . .

RUN bun run build

# Runtime
FROM nginx:alpine

RUN apk add --no-cache jq

ENV PUBSUB_EMULATOR_URL="localhost:8085" \
    STORAGE_EMULATOR_URL="localhost:4443" \
    FIRESTORE_EMULATOR_URL="localhost:8086" \
    DATASTORE_EMULATOR_URL="localhost:8087" \
    DATASTORE_FILE_SERVER_URL="localhost:9999"

COPY deployments/nginx.conf /etc/nginx/templates/app.conf.template
COPY deployments/generate-runtime-config.sh /docker-entrypoint.d/99-generate-runtime-config.sh
COPY --from=build-stage /src/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]