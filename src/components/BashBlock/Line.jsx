import React, { PureComponent, PropTypes } from 'react'

import styles from './BashBlock.scss'

export default class Line extends PureComponent {
  static propTypes = {
    value: PropTypes.string.isRequired,
  }

  render() {
    return (
      <div className={styles.line}>
        <span className={styles.prefix}>$&nbsp;</span>
        {this.props.value}
      </div>
    )
  }
}
