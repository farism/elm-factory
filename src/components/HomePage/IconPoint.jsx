import React, { PureComponent, PropTypes } from 'react'

import styles from './IconPoint.scss'

export default class IconPoint extends PureComponent {
  static propTypes = {
    icon: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
  }

  render() {
    const { children, icon, title } = this.props
    const Icon = icon

    return (
      <div className={styles.container}>
        <div className={styles.icon}>
          <Icon />
        </div>
        <h3>
          {title}
        </h3>
        <p>
          {children}
        </p>
      </div>
    )
  }
}
