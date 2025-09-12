# GCP Emulator UI

A modern web interface for managing Google Cloud Platform emulator services 🎮

[![Release](https://img.shields.io/github/release/drehelis/gcp-emulator-ui.svg?style=flat-square)](https://github.com/drehelis/gcp-emulator-ui/releases/latest)
[![license](https://img.shields.io/github/license/drehelis/gcp-emulator-ui.svg?style=flat-square)](LICENSE)

https://github.com/user-attachments/assets/a578672c-4ecc-44ce-9fe1-ea606bbb775c

> Supports `amd64` and `arm64` container images

## Features

### Supported Emulators
- **Google Cloud Pub/Sub**
   * Create, view, and manage Pub/Sub topics
   * Handle subscriptions with pull/push configurations
   * Publish messages with attributes and template variables
   * Import/export configurations
- **Google Cloud Storage** - Coming soon
- **Google Firestore/Datastore mode** - Coming soon

## Quick Start
```bash
# Start pubsub emulator first
docker run \
   --rm \
   --publish 8085:8085 \
   gcr.io/google.com/cloudsdktool/cloud-sdk:emulators sh -c 'gcloud beta emulators pubsub start --host-port=0.0.0.0:8085'

# Now start the UI
docker run \
   --rm \
   --env PUBSUB_EMULATOR_URL="http://host.docker.internal:8085" \
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
| `VITE_ENABLE_PUBSUB` | `true` | Enable Pub/Sub service management |
| `VITE_ENABLE_CLOUD_STORAGE` | `false` | Enable Cloud Storage service (coming soon) |
| `VITE_PUBSUB_BASE_URL` | `http://localhost:8085` | Pub/Sub emulator endpoint |
| `VITE_STORAGE_BASE_URL` | `http://localhost:8086` | Storage emulator endpoint |

## Development

### Project Structure

```
src/
├── api/           # API client configurations
├── components/    # Reusable Vue components
├── composables/   # Vue composition functions
├── layouts/       # Page layout components
├── router/        # Vue Router configuration
├── stores/        # Pinia state management
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
└── views/         # Page components
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
