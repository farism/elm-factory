import React, { PropTypes } from 'react'

import styles from './BashBlock.scss'

export default function Line({ value }) {
  return (
    <div className={styles.line}>
      <span className={styles.prefix}>$&nbsp;</span>
      {value}
    </div>
  )
}

Line.propTypes = {
  value: PropTypes.string.isRequired,
}
