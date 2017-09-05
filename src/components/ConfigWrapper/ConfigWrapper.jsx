import React, { PropTypes } from 'react'
import { Link, NavLink } from 'react-router-dom'

import ConfigDoc from '../ConfigDoc'
import { PrimarySection, SubtronSection } from '../PageSections'
import BashBlock, { Comment, Gap, Line } from '../BashBlock'

import { isActive } from '../PageWrapper/PageWrapper'
import styles from '../PageWrapper/PageWrapper.scss'

const docs = [{ label: 'Overview', href: '/config' }]

const example = {
  stylesheets: './src/Stylesheets.elm',
  build: {
    main: './src/Main.elm',
    output: 'build',
    publicPath: 'public',
    html: './src/index.prod.ejs',
  },
  dev: {
    host: '127.0.0.1',
    port: 8000,
    reactorHost: '127.0.0.1',
    reactorPort: 8001,
    html: './src/index.dev.ejs',
  },
}

function defaultDocView() {
  return (
    <div>
      <h1>Overview</h1>
      <p>
        The Elm Factory CLI tool is built on{' '}
        <a href="https://github.com/yargs/yargs" target="_blank">
          yargs
        </a>{' '}
        , so it supports configuration through an ".elmfactoryrc" in your
        project root folder by default. View the{' '}
        <Link to="/cli">CLI Usage</Link> for more information about what each
        setting does.
      </p>
      <code>
        <pre>
          // .elmfactoryrc or .elmfactoryrc.json
          <br />
          <br />
          {JSON.stringify(example, null, 2)}
        </pre>
      </code>
      <p />
    </div>
  )
}

export default function ConfigWrapper({ match }) {
  const slug = match.params.config

  return (
    <div>
      <SubtronSection title="Configuration">
        Documention for Elm Factory's configuration object
      </SubtronSection>
      <PrimarySection>
        <div className={styles.sidenavContainer}>
          <div className={styles.side}>
            <h3>General</h3>
            <ul className={styles.links}>
              {docs.map((doc, i) =>
                <li key={doc.label} className={styles.link}>
                  <NavLink to={doc.href} isActive={isActive(slug, i)}>
                    {doc.label}
                  </NavLink>
                </li>
              )}
            </ul>
          </div>
          <div className={styles.doc}>
            {defaultDocView()}
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
