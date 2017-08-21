import React, { PropTypes } from 'react'

import styles from './Separator.scss'

export default function Separator({ big }) {
  return <hr className={`${styles.separator} ${big ? styles.big : ''}`} />
}

Separator.propTypes = {
  big: PropTypes.bool,
}
