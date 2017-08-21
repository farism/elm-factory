import React, { PropTypes } from 'react'
import { Link } from 'react-router-dom'

import styles from './IconPoint.scss'

function withLink(href, contents) {
  return (
    <Link to={href}>
      {contents}
    </Link>
  )
}

export default function IconPoint({ children, href, icon, title }) {
  const Icon = icon

  const content = (
    <div>
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

  return (
    <div className={styles.container}>
      {href ? withLink(href, content) : content}
    </div>
  )
}

IconPoint.propTypes = {
  icon: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
}
