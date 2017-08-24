import React, { PropTypes } from 'react'
import { Link, routerShape } from 'react-router-dom'

import ConfigDoc from '../ConfigDoc'
import { PrimarySection, SubtronSection } from '../PageSections'
import BashBlock, { Comment, Gap, Line } from '../BashBlock'

import styles from './ConfigWrapper.scss'

const extras = [{ label: 'Overview', href: '/config' }]

const example = {
  main: './src/Main.elm',
  stylesheets: './src/Stylesheets.elm',
  build: {
    output: 'build',
    publicPath: 'public',
    template: './src/index.prod.ejs',
  },
  dev: {
    template: './src/index.dev.ejs',
    host: '127.0.0.1',
    port: 8000,
    reactorHost: '127.0.0.1',
    reactorPort: 8001,
  },
}

function getDefaultDoc(type) {
  switch (type) {
    default:
      return (
        <div>
          <h1>Overview</h1>
          <p>
            Elm Factory is configured through the ".elmfactoryrc" in your
            project folder.
          </p>
          <code>
            <pre>
              // .elmfactoryrc
              <br />
              <br />
              {JSON.stringify(example, null, 2)}
            </pre>
          </code>
          <p />
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

export default function ConfigWrapper({ match }) {
  // console.log(match)
  // const targetProp = config.find(prop => prop.name === property)

  return (
    <div>
      <SubtronSection title="Configuration">
        Documention for Elm Factory's configuration object
      </SubtronSection>
      <PrimarySection>
        <div className={styles.container}>
          <div className={styles.commandList}>
            <h3>General</h3>
            {sideMenuView(extras)}
            {/* <h3>Make Properties</h3>
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
            )} */}
          </div>
          <div className={styles.commandDocs}>
            {getDefaultDoc(match.params.type)}
            {/* {targetProp ? <ConfigDoc prop={targetProp} /> : } */}
          </div>
        </div>
      </PrimarySection>
    </div>
  )
}

ConfigWrapper.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape().isRequired,
  }).isRequired,
}
