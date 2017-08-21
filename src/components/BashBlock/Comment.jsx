import React, { PropTypes } from 'react'

import styles from './BashBlock.scss'

export default function Comment({ value }) {
  return (
    <div className={styles.comment}>
      <span className={styles.prefix}>#&nbsp;</span>
      {value}
    </div>
  )
}

Comment.propTypes = {
  value: PropTypes.string.isRequired,
}
