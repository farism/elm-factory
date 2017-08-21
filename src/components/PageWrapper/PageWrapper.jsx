import React, { PropTypes } from 'react'
import { Link } from 'react-router'
import MarkGithubIcon from 'react-octicons-svg/dist/MarkGithubIcon'

import { ElmSVG } from '../SVG'
import NavLink from './NavLink'

import styles from './PageWrapper.scss'

export default function PageWrapper({ children }) {
  return (
    <div className={styles.mainWrapper}>
      <header className={styles.header}>
        <div className={styles.container}>
          <Link className={styles.mainLink} to="/">
            <ElmSVG width={48} height={48} />
            FACTORY
          </Link>

          <nav className={styles.nav}>
            <NavLink href="/" text="Getting Started" />
            <NavLink href="/cli" text="CLI Usage" />
            {/* <NavLink href="/config" text="Configuration" /> */}
            <NavLink
              href="https://github.com/farism/elm-factory"
              text={<MarkGithubIcon />}
              external
            />
          </nav>
        </div>
      </header>
      <div className={styles.pageContainer}>
        {children}
      </div>
      <footer className={styles.footer} />
    </div>
  )
}

PageWrapper.propTypes = {
  children: PropTypes.node,
}
