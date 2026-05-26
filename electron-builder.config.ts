import type { Configuration } from 'electron-builder'

const config: Configuration = {
  appId: 'com.blanknotes.app',
  productName: 'BlankNotes',
  copyright: 'Copyright © 2026',
  directories: {
    buildResources: 'resources',
    output: 'dist'
  },
  files: ['out/**/*'],
  extraResources: [
    {
      from: 'resources/fonts',
      to: 'fonts',
      filter: ['**/*.ttf']
    }
  ],
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    icon: 'resources/icon.ico'
  },
  mac: {
    target: [{ target: 'dmg', arch: ['x64', 'arm64'] }],
    icon: 'resources/icon.icns'
  },
  linux: {
    target: [{ target: 'AppImage', arch: ['x64'] }],
    icon: 'resources/icon.png'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true
  }
}

export default config
