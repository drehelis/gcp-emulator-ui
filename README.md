# GCP Emulator UI

A modern web interface for managing Google Cloud Platform emulator services 🎮

[![Release](https://img.shields.io/github/release/drehelis/gcp-emulator-ui.svg)](https://github.com/drehelis/gcp-emulator-ui/releases/latest)
[![Release-Date](https://img.shields.io/github/release-date/drehelis/gcp-emulator-ui
)](https://github.com/drehelis/gcp-emulator-ui/releases/latest)
[![License](https://img.shields.io/github/license/drehelis/gcp-emulator-ui.svg)](LICENSE)

https://github.com/user-attachments/assets/f6452186-131f-4f6d-a744-678e4173bc0d

> Supports `amd64` and `arm64` container images

## Disclaimer
This is an unofficial third-party application and is not affiliated with, endorsed by, or sponsored by Google LLC or Google Cloud Platform.

## Features

### Supported Emulators

- **Google Cloud Pub/Sub ([gcloud](https://cloud.google.com/pubsub/docs/emulator))**
   * Create, view, and manage Pub/Sub topics
   * Handle subscriptions with pull/push configurations
   * Publish messages with attributes and template variables
   * Import/export topics, subscriptions, and message templates

- **Google Cloud Storage ([fake-gcs](https://github.com/fsouza/fake-gcs-server))**
   * Create, view, and manage Storage buckets
   * Support drag'n'drop files and folders
   * Import/export bucket configurations

- **Google Firestore ([gcloud](https://cloud.google.com/firestore/native/docs/emulator))**
   * Create, view, and manage Collections
   * Document CRUD operations with field editing
   * Multiple databases support
   * Import/export collections and documents

- **Google Firestore (datastore-mode) ([gcloud](https://cloud.google.com/datastore/docs/tools/datastore-emulator))**
   > Named database mutation operations not supported by Datastore emulator
   * Create, view, and manage namespaces on `(default)` database.
   * Query/Read operations on named databases
   * Import/export functionality


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
   gcr.io/google.com/cloudsdktool/google-cloud-cli:emulators sh -c 'gcloud beta emulators pubsub start --host-port=0.0.0.0:8085'

# Start Google Firestore emulator
docker run \
   --rm \
   --publish 8086:8086 \
   gcr.io/google.com/cloudsdktool/google-cloud-cli:emulators sh -c 'gcloud beta emulators firestore start --host-port=0.0.0.0:8086'

# Start Google Firestore datastore-mode emulator
docker run \
   --rm \
   --publish 8087:8087 \
   gcr.io/google.com/cloudsdktool/google-cloud-cli:emulators sh -c 'gcloud beta emulators firestore start --database-mode=datastore-mode --host-port=0.0.0.0:8087'

# Start fake-gcs emulator
docker run \
   --rm \
   --publish 4443:4443 \
   fsouza/fake-gcs-server -scheme http

# Now start the UI
docker run \
   --rm \
   --env PUBSUB_EMULATOR_URL="host.docker.internal:8085"    \
   --env FIRESTORE_EMULATOR_URL="host.docker.internal:8086" \
   --env DATASTORE_EMULATOR_URL="host.docker.internal:8087" \
   --env DATASTORE_FILE_SERVER_URL="host.docker.internal:9999" \
   --env STORAGE_EMULATOR_URL="host.docker.internal:4443"   \
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
| `VITE_DATASTORE_BASE_URL` | `http://localhost:8087` | Firestore datastore-mode emulator endpoint |
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

## Credits

### Icons
This project uses [**Heroicons**](https://heroicons.com/) - a set of free MIT-licensed high-quality SVG icons created by [Tailwind Labs](https://tailwindlabs.com/).

- **License**: MIT
- **Repository**: [github.com/tailwindlabs/heroicons](https://github.com/tailwindlabs/heroicons)
- **Copyright**: © 2020 Refactoring UI Inc.

All icons are used in accordance with the MIT License. See [Heroicons License](https://github.com/tailwindlabs/heroicons/blob/master/LICENSE) for details.

## Feedback and Contributions

Feedback and contributions are welcome! Please feel free to:
- [Open an issue](https://github.com/drehelis/gcp-emulator-ui/issues) for bug reports or feature requests
- [Submit a pull request](https://github.com/drehelis/gcp-emulator-ui/pulls) for bug fixes or new features

## License

This project is licensed under the MIT License.
