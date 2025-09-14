/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_PUBSUB_BASE_URL: string
    readonly VITE_STORAGE_BASE_URL: string
    readonly VITE_GOOGLE_CLOUD_PROJECT_ID: string
    readonly VITE_VERSION: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
