/* eslint-disable react/no-multi-comp */

import React, { PureComponent, PropTypes } from 'react'

import Separator from '../Separator'

import styles from './PageSection.scss'

class PrimarySection extends PureComponent {
  static propTypes = {
    children: PropTypes.node,
  }

  render() {
    return (
      <div className={`${styles.section} ${styles.primary}`}>
        {this.props.children}
      </div>
    )
  }
}

class SecondarySection extends PureComponent {
  static propTypes = {
    children: PropTypes.node,
  }

  render() {
    return (
      <div className={`${styles.section} ${styles.secondary}`}>
        {this.props.children}
      </div>
    )
  }
}

class SubtronSection extends PureComponent {
  static propTypes = {
    title: PropTypes.string,
    children: PropTypes.node,
  }

  render() {
    const { children, title } = this.props
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
}

class SectionHeader extends PureComponent {
  static propTypes = {
    title: PropTypes.string,
    children: PropTypes.node,
  }

  render() {
    const { children, title } = this.props

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
}

export { PrimarySection, SecondarySection, SectionHeader, SubtronSection }
