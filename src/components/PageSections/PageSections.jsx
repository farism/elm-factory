import React, { PropTypes } from 'react'

import Separator from '../Separator'

import styles from './PageSection.scss'

function PrimarySection({ children }) {
  return (
    <div className={`${styles.section} ${styles.primary}`}>
      {children}
    </div>
  )
}

PrimarySection.propTypes = {
  children: PropTypes.node,
}

function SecondarySection({ children }) {
  return (
    <div className={`${styles.section} ${styles.secondary}`}>
      {children}
    </div>
  )
}

SecondarySection.propTypes = {
  children: PropTypes.node,
}

function SubtronSection({ children, title }) {
  return (
    <div className={`${styles.section} ${styles.subtron}`}>
      <h1>
        {title}
      </h1>
      <p>
        {children}
      </p>
    </div>
  )
}

SubtronSection.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node,
}

function SectionHeader({ children, title }) {
  return (
    <div>
      <h1 className={styles.sectionHeaderTitle}>
        {title}
      </h1>
      <p className={styles.sectionHeaderContent}>
        {children}
      </p>
      <Separator big />
    </div>
  )
}

SectionHeader.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node,
}

export { PrimarySection, SecondarySection, SectionHeader, SubtronSection }
