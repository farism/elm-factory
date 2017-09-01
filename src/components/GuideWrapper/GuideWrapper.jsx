import React, { PropTypes } from 'react'
import { NavLink, matchShape } from 'react-router-dom'

import docs from '../../docs'
import GuideDoc from '../GuideDoc'
import { PrimarySection, SubtronSection } from '../PageSections'

import { isActive } from '../PageWrapper/PageWrapper'
import styles from '../PageWrapper/PageWrapper.scss'

export default function GuideWrapper({ match }) {
  const slug = match.params.guide
  const doc = docs.find(d => d.slug === match.params.guide) || docs[0]

  return (
    <div>
      <SubtronSection title="Guides">
        Elm Factory examples and recipes
      </SubtronSection>
      <PrimarySection>
        <div className={styles.sidenavContainer}>
          <div className={styles.side}>
            <h3>Guides</h3>
            <ul className={styles.links}>
              {docs.map((doc, i) =>
                <li key={doc.command} className={styles.link}>
                  <NavLink
                    to={`/guide/${doc.slug}`}
                    isActive={isActive(slug, i)}
                  >
                    {doc.command}
                  </NavLink>
                </li>
              )}
            </ul>
          </div>
          <div className={styles.doc}>
            {doc && <GuideDoc doc={doc} />}
          </div>
        </div>
      </PrimarySection>
    </div>
  )
}

GuideWrapper.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape().isRequired,
  }).isRequired,
}
