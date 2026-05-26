// Typed convenience wrappers — currently thin pass-throughs but
// provide a single place to add retry logic or error normalization later.
export const api = window.api

// Convert an absolute path under userData (e.g. C:\Users\...\blanknotes\documents\foo.pdf)
// into a bn-file:// URL that the renderer can fetch safely under webSecurity.
// Falls back to file:// if the path doesn't look like it lives under documents/ or attachments/.
export function toAssetUrl(absolutePath: string): string {
  const normalized = absolutePath.replace(/\\/g, '/')
  const match = normalized.match(/\/(documents|attachments)\/([^/]+)$/)
  if (match) {
    return `bn-file://${match[1]}/${encodeURIComponent(match[2])}`
  }
  return `file:///${normalized}`
}
