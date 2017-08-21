import React, { PropTypes } from 'react'

import styles from './IconPoint.scss'

export default function IconPoint({ children, icon, title }) {
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

IconPoint.propTypes = {
  icon: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
}
