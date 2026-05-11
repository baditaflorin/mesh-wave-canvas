export const appConfig = {
  appName: "mesh-wave-canvas",
  storagePrefix: "mesh-wave-canvas",
  version: __APP_VERSION__,
  commit: __GIT_COMMIT__,
  repositoryUrl: "https://github.com/baditaflorin/mesh-wave-canvas",
  pagesUrl: "https://baditaflorin.github.io/mesh-wave-canvas/",
  signalingUrl:
    (import.meta.env.VITE_WEBRTC_SIGNALING as string | undefined) ?? "wss://turn.0docker.com/ws",
  turnTokenUrl:
    (import.meta.env.VITE_TURN_TOKEN_URL as string | undefined) ??
    "https://turn.0docker.com/credentials",
} as const;
