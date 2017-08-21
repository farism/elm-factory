import React, { PropTypes } from 'react'

import styles from './BashBlock.scss'

export default function BashBlock({ children, fullWidth, closeText, onClose }) {
  return (
    <div className={`${styles.block} ${fullWidth ? styles.fullWidth : ''}`}>
      <div className={styles.blockWidthConstrainer}>
        {children}
      </div>
      <div className={styles.closeButton}>
        <button onClick={onClose}>
          {closeText}
        </button>
      </div>
    </div>
  )
}

BashBlock.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  fullWidth: PropTypes.bool,
  closeText: PropTypes.string,
  onClose: PropTypes.func,
}

BashBlock.defaultProps = {
  closeText: '',
  onClose: () => {},
}
