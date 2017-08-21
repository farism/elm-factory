import React, { PureComponent } from 'react'
import { Link, routerShape } from 'react-router'

import makeProps from '../../make_props'
import publishProps from '../../publish_props'
import ConfigPropDoc from '../ConfigPropDoc'
import { PrimarySection, SubtronSection } from '../PageSections'

import styles from './ConfigWrapper.scss'

const extras = [
  { label: 'Overview', href: '/config' },
  { label: 'Secure Variables', href: '/config/extra/secure' },
  { label: 'Templated Variables', href: '/config/extra/templating' },
]

const example = {
  make_targets: {
    win32: ['squirrel'],
    darwin: ['zip'],
    linux: ['deb', 'rpm'],
  },
  electronPackagerConfig: {},
  electronWinstallerConfig: {
    name: '',
  },
  electronInstallerDebian: {},
  electronInstallerRedhat: {},
  github_repository: {
    owner: '',
    name: '',
  },
  windowsStoreConfig: {
    packageName: '',
  },
}

function getDefaultDoc(router) {
  const extra = router.params.extra
  switch (extra) {
    case 'secure':
      return (
        <div>
          <h1>Secure Variables</h1>
          <p>
            Some variables that you might need to put in your Forge Config are
            quite sensitive and shouldn't be committed to version control.
            Examples include your signing certificate password or your AWS
            credentials for publishing to S3.
          </p>
          <p>
            Luckily <b>every single one</b> of Electron Forge's config
            properties can be configed as an environment variable instead of in
            your config object. You simply take the "path" of the config
            property. For instance
            "electronWinstallerConfig.certificatePassword" and turn it into
            upper case snake case, then prefix it with "ELECTRON_FORGE".
          </p>
          <code>
            <pre>
              {
                'ELECTRON_FORGE_ELECTRON_WINSTALLER_CONFIG_CERTIFICATE_PASSWORD=MySecretPassword'
              }
            </pre>
          </code>
          <p>
            Yes this is a long variable name but it allows you to set whatever
            config options you like through environment variables on CI. Some
            properties accept other specific environment variables (The S3
            publisher for instance), and they will be explicity documented.
          </p>
        </div>
      )
    case 'templating':
      return (
        <div>
          <h1>Templating Variables</h1>
          <p>
            For lots of your config you might find yourself duplicating words or
            phrases, for instance your application name would be used in several
            places. This makes it much harder to change this value as you have
            to change it in several places and be certain you don't miss any.
          </p>
          <p>
            As a solution to this problem we allow you to use{' '}
            <a href="https://lodash.com/docs/4.16.6#template" target="blank">
              String Templating
            </a>{' '}
            in any of your properties. For instance:
          </p>
          <code>
            <pre>
              {JSON.stringify(
                {
                  electronPackagerConfig: {
                    name: '<%= productName %>',
                  },
                },
                null,
                2
              )}
            </pre>
          </code>
          <p>
            The above example will configure Electron Packager to use your
            package.json's "productName" property as the name for your packaged
            app.
          </p>
        </div>
      )
    default:
      return (
        <div>
          <h1>Overview</h1>
          <p>
            Electron Forge is configured through the "forge" property in your
            package.json's config object. By default this looks something like
            this.
          </p>
          <code>
            <pre>
              {JSON.stringify(example, null, 2)}
            </pre>
          </code>
          <p>
            This is the minimal config required to get started using Electron
            Forge, for specifics on how to configure all the available
            properties check out their docs in the properties menu on the left.
          </p>
        </div>
      )
  }
}

function sideMenuView(items) {
  return items.map(item =>
    <div key={item.label} className={styles.commandLink}>
      <Link to={item.href}>
        {item.label}
      </Link>
    </div>
  )
}

export default function ConfigWrapper({ router }) {
  const targetProp =
    makeProps.find(prop => prop.name === property) ||
    publishProps.find(prop => prop.name === property)

  return (
    <div>
      <SubtronSection title="Configuration">
        Documention for Electron Forge&apos;s Config Object
      </SubtronSection>
      <PrimarySection>
        <div className={styles.container}>
          <div className={styles.commandList}>
            <h3>General</h3>
            {sideMenuView(extras)}
            <h3>Make Properties</h3>
            {sideMenuView(
              makeProps.map(prop => ({
                label: prop.name,
                href: `/config/${prop.name}`,
              }))
            )}
            <h3>Publish Properties</h3>
            {sideMenuView(
              publishProps.map(prop => ({
                label: prop.name,
                href: `/config/${prop.name}`,
              }))
            )}
          </div>
          <div className={styles.commandDocs}>
            {targetProp ? <ConfigPropDoc prop={targetProp} /> : getDefaultDoc()}
          </div>
        </div>
      </PrimarySection>
    </div>
  )
}

ConfigWrapper.propTypes = {
  router: routerShape,
}
