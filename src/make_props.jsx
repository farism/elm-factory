import React from 'react'
import { Link } from 'react-router-dom'

module.exports = [
  {
    name: 'make_targets',
    example: {
      win32: ['squirrel'],
      darwin: ['dmg', 'zip'],
      linux: ['deb', 'rpm'],
    },
    description: [
      'The "make_targets" property is used to configure the types of distributables that Electron Forge will create for each platform.  This object consists of three keys "win32", "darwin" and "linux" each set to an array of make targets for the given platform.',
      <p>
        You can find a{' '}
        <Link to="/config/extra/possible-make-targets">
          list of make targets
        </Link>{' '}
        in our documentation.
      </p>,
    ],
  },
  {
    name: 'electronPackagerConfig',
    example: {
      asar: true,
      quiet: true,
      protocol: 'myapp://',
      icon: './images/myicon',
    },
    description: [
      'This config object provides options directly to electron-packager, the tool we use to package your app behind the scenes.',
      'Please note that any option that is expected to be a function, you can provide a path to a file and electron-forge will automatically require it for you and pass it in to that option.  (afterCopy functions for instance).',
      <p>
        You can find the complete documention for all options you can pass to
        the packager on the{' '}
        <a href="https://github.com/electron-userland/electron-packager/blob/master/docs/api.md">
          Electron Packager Repository
        </a>
      </p>,
    ],
  },
  {
    name: 'electronWinstallerConfig',
    example: {
      loadingGif: './images/loading.gif',
      certificateFile: './cert.pfx',
      setupIcon: './images/myicon.ico',
    },
    description: [
      'This config object provides options directly to electron-winstaller, the tool we use to generate Squirrel installers behind the scenes.',
      <p>
        Please note that for options like the signing certificate password you
        should read our docs on{' '}
        <Link to="/config/extra/secure">Secure Variables</Link>
      </p>,
      <p>
        You can find the complete documention for all options you can pass to
        electron-winstaller on the{' '}
        <a href="https://github.com/electron/windows-installer#usage">
          Electron Windows Installer Repository
        </a>
      </p>,
    ],
  },
  {
    name: 'windowsStoreConfig',
    example: {
      packageVersion: '<%= version %>.0',
      deploy: false,
      publisher: 'CN=developmentca',
      devCert: 'C:\\devcert.pfx',
    },
    description: [
      'This config object provides options directly to electron-windows-store, the tool we use to generate Windows Store APPX packages behind the scenes.',
      <p>
        Please note that the information in this config object MUST match your
        application identity on the{' '}
        <a href="https://docs.microsoft.com/en-us/windows/uwp/publish/view-app-identity-details">
          Windows Store
        </a>
      </p>,
      <p>
        You can find the complete documention for all options you can pass to
        electron-windows-store on the{' '}
        <a href="https://github.com/felixrieseberg/electron-windows-store#programmatic-usage">
          Electron Windows Store Repository
        </a>
      </p>,
    ],
  },
  {
    name: 'electronInstallerDMG',
    example: {
      background: 'path/to/image.png',
      icon: 'path/to/icon.icns',
      format: 'ULFO',
    },
    description: [
      "This config object provides options directly to electron-installer-dmg, the tool we use to generate DMG's behind the scenes.",
      <p>
        You can find the complete documention for all options you can pass to
        electron-installer-dmg on the{' '}
        <a href="https://github.com/mongodb-js/electron-installer-dmg#api">
          Electron Installer DMG Repository
        </a>
      </p>,
    ],
  },
  {
    name: 'electronInstallerDebian',
    example: {
      icon: 'resources/Icon.png',
      categories: ['Utility'],
      homepage: 'https://foo.com',
    },
    description: [
      'This config object provides options directly to electron-installer-debian, the tool we use to generate .deb packages behind the scenes.',
      <p>
        You can find the complete documention for all options you can pass to
        electron-installer-debian on the{' '}
        <a href="https://github.com/unindented/electron-installer-debian#options">
          Electron Installer Debian Repository
        </a>
      </p>,
    ],
  },
  {
    name: 'electronInstallerRedhat',
    example: {
      license: 'MIT',
      requires: ['lsb', 'libappindictor'],
      compressionLevel: 9,
      categories: ['Utility'],
    },
    description: [
      'This config object provides options directly to electron-installer-redhat, the tool we use to generate .rpm packages behind the scenes.',
      <p>
        You can find the complete documention for all options you can pass to
        electron-installer-redhat on the{' '}
        <a href="https://github.com/unindented/electron-installer-redhat#options">
          Electron Installer Redhat Repository
        </a>
      </p>,
    ],
  },
  {
    name: 'electronInstallerFlatpak',
    example: {
      runtime: 'org.freedesktop.Platform',
      icon: 'path/to/icon.png',
      categories: ['Utility'],
      branch: 'master',
    },
    description: [
      'This config object provides options directly to electron-installer-flatpak, the tool we use to generate Flatpak packages behind the scenes.',
      <p>
        You can find the complete documention for all options you can pass to
        electron-installer-flatpak on the{' '}
        <a href="https://github.com/endlessm/electron-installer-flatpak#options">
          Electron Installer Flatpak Repository
        </a>
      </p>,
    ],
  },
]
