# GCP Emulator UI

A modern web interface for managing Google Cloud Platform emulator services 🎮

[![Release](https://img.shields.io/github/release/drehelis/gcp-emulator-ui.svg)](https://github.com/drehelis/gcp-emulator-ui/releases/latest)
[![Release-Date](https://img.shields.io/github/release-date/drehelis/gcp-emulator-ui
)](https://github.com/drehelis/gcp-emulator-ui/releases/latest)
[![License](https://img.shields.io/github/license/drehelis/gcp-emulator-ui.svg)](LICENSE)

<p align="center">
  <p><img width="2354" height="1436" alt="pubsub_screen" src="https://github.com/user-attachments/assets/3048bb53-0f6f-415a-8152-35734707206e" /></p>
  <p><img width="2354" height="1436" alt="bucket_screen" src="https://github.com/user-attachments/assets/d0494da1-ece9-4a6c-9e08-a31d1cb684f5" /></p>
  <p><img width="2354" height="1436" alt="firestore_screen" src="https://github.com/user-attachments/assets/17bdc291-cbca-44d3-be44-fcb01b008359" /></p>
</p>

> Supports `amd64` and `arm64` container images

## Features

### Supported Emulators

- **Google Cloud Pub/Sub ([gcloud](https://cloud.google.com/pubsub/docs/emulator))**
   * Create, view, and manage Pub/Sub topics
   * Handle subscriptions with pull/push configurations
   * Publish messages with attributes and template variables
   * Import/export configurations

- **Google Cloud Storage ([fake-gcs](https://github.com/fsouza/fake-gcs-server))**
   * Create, view, and manage Storage buckets
   * Support drag'n'drop files and folders
   * Import/export configurations

- **Google Firestore ([gcloud](https://cloud.google.com/firestore/native/docs/emulator))**
   * Create, view, and manage Collections
   * Document CRUD operations with field editing
   * Multiple databases support

- **Google Datastore mode ([gcloud](https://cloud.google.com/datastore/docs/tools/datastore-emulator))** - Coming soon


## Quick Start

**Use Docker Compose:**
```bash
git clone git@github.com:drehelis/gcp-emulator-ui.git
cd gcp-emulator-ui

docker-compose up
```

**Or start individual container:**
```bash
# Start Google Pub/Sub emulator
docker run \
   --rm \
   --publish 8085:8085 \
   gcr.io/google.com/cloudsdktool/cloud-sdk:emulators sh -c 'gcloud beta emulators pubsub start --host-port=0.0.0.0:8085'

# Start Google Firestore emulator
docker run \
   --rm \
   --publish 8085:8085 \
   gcr.io/google.com/cloudsdktool/cloud-sdk:emulators sh -c 'gcloud beta emulators firestore start --host-port=0.0.0.0:8086'

# Start fake-gcs emulator
docker run \
   --rm \
   --publish 4443:4443 \
   fsouza/fake-gcs-server -scheme http

# Now start the UI
docker run \
   --rm \
   --env PUBSUB_EMULATOR_URL="host.docker.internal:8085" \
   --env FIRESTORE_EMULATOR_URL="host.docker.internal:8086" \
   --env STORAGE_EMULATOR_URL="host.docker.internal:4443" \
   --publish 9090:80 \
   ghcr.io/drehelis/gcp-emulator-ui:main
```

Browse to http://localhost:9090

### Development Setup

1. **Clone and install dependencies**
   ```bash
   git clone git@github.com:drehelis/gcp-emulator-ui.git
   cd gcp-emulator-ui
   code .
   (run in devcontainer)
   
   npm install
   ```

2. **Configure environment**
   ```bash
   cp -v .env.example .env
   # Edit .env with your settings
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Navigate to `http://localhost:5173`

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_PUBSUB_BASE_URL` | `http://localhost:8085` | Pub/Sub emulator endpoint |
| `VITE_FIRESTORE_BASE_URL` | `http://localhost:8086` | Firestore emulator endpoint |
| `VITE_STORAGE_BASE_URL` | `http://localhost:4443` | Storage emulator endpoint |

## Development

### Project Structure

```
src/
├── api/           # API client configurations
├── assets/        # Static assets and styles
├── components/    # Reusable Vue components
├── composables/   # Vue composition functions
├── layouts/       # Page layout components
├── plugins/       # Vue plugins and global configurations
├── router/        # Vue Router configuration
├── stores/        # Pinia state management
├── types/         # TypeScript type definitions
├── utils/         # Utility functions and helpers
└── views/         # Page components organized by feature
```

## Stack

### Core Framework
- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Heroicons** - Beautiful hand-crafted SVG icons

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
