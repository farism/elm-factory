import React, { PropTypes } from 'react'
import { Link, matchShape } from 'react-router-dom'

import docs from '../../docs'
import CLIDoc from '../CLIDoc'
import { PrimarySection, SubtronSection } from '../PageSections'

import styles from './CLIWrapper.scss'

export default function CLIWrapper({ match }) {
  const targetDoc = docs.find(doc => doc.command === match.params.command)

  return (
    <div>
      <SubtronSection title="CLI Docs">
        Documention for Elm Factory&apos;s CLI interface
      </SubtronSection>
      <PrimarySection>
        <div className={styles.container}>
          <div className={styles.commandList}>
            <h3>Commands</h3>
            {docs.map(doc =>
              <div key={doc.command} className={styles.commandLink}>
                <Link to={`/cli/${doc.command}`}>
                  {doc.command}
                </Link>
              </div>
            )}
          </div>
          <div className={styles.commandDocs}>
            {targetDoc
              ? <CLIDoc doc={targetDoc} />
              : <div className={styles.noCommand}>
                  <h1>Choose a Command</h1>
                  <p>To view the docs for a command, select it on the left</p>
                </div>}
          </div>
        </div>
      </PrimarySection>
    </div>
  )
}

CLIWrapper.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape().isRequired,
  }).isRequired,
}
