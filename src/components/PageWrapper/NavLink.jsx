import React, { PropTypes } from 'react'
import { Link } from 'react-router-dom'

import styles from './NavLink.scss'

export default function NavLink({ external, href, text }) {
  if (external) {
    return (
      <a
        className={styles.link}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {text}
      </a>
    )
  }
  return (
    <Link className={styles.link} to={href}>
      {text}
    </Link>
  )
}

NavLink.propTypes = {
  external: PropTypes.bool,
  href: PropTypes.string,
  text: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
}
