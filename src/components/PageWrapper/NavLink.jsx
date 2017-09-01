import React, { PropTypes } from 'react'
import { NavLink } from 'react-router-dom'

import styles from './NavLink.scss'

export default function HeaderLink({ external, href, text }) {
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
    <NavLink className={styles.link} to={href}>
      {text}
    </NavLink>
  )
}

HeaderLink.propTypes = {
  external: PropTypes.bool,
  href: PropTypes.string,
  text: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
}
