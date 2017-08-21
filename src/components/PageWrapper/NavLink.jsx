import React, { PureComponent, PropTypes } from 'react'
import { Link } from 'react-router'

import styles from './NavLink.scss'

export default class NavLink extends PureComponent {
  static propTypes = {
    external: PropTypes.bool,
    href: PropTypes.string,
    text: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
  }

  render() {
    const { external, href, text } = this.props
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
}
