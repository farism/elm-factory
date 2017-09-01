import React, { PropTypes } from 'react'
import { NavLink, matchShape } from 'react-router-dom'

import docs from '../../docs'
import CLIDoc from '../CLIDoc'
import { PrimarySection, SubtronSection } from '../PageSections'

import { isActive } from '../PageWrapper/PageWrapper'
import styles from '../PageWrapper/PageWrapper.scss'

export default function CLIWrapper({ match }) {
  const slug = match.params.command
  const doc = docs.find(d => d.command === slug) || docs[0]

  return (
    <div>
      <SubtronSection title="CLI Docs">
        Documention for Elm Factory&apos;s CLI interface
      </SubtronSection>
      <PrimarySection>
        <div className={styles.sidenavContainer}>
          <div className={styles.side}>
            <h3>Commands</h3>
            <ul className={styles.links}>
              {docs.map((doc, i) =>
                <li key={doc.command} className={styles.link}>
                  <NavLink
                    to={`/cli/${doc.command}`}
                    isActive={isActive(slug, i)}
                  >
                    {doc.command}
                  </NavLink>
                </li>
              )}
            </ul>
          </div>
          <div className={styles.doc}>
            {doc && <CLIDoc doc={doc} />}
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
