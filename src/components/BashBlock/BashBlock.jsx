import React, { PureComponent, PropTypes } from 'react'

import styles from './BashBlock.scss'

export default class BashBlock extends PureComponent {
  static propTypes = {
    children: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.node),
      PropTypes.node,
    ]),
    fullWidth: PropTypes.bool,
    closeText: PropTypes.string,
    onClose: PropTypes.func,
  }

  static defaultProps = {
    closeText: '',
    onClose: () => {},
  }

  _close = () => this.props.onClose()

  render() {
    return (
      <div
        className={`${styles.block} ${this.props.fullWidth
          ? styles.fullWidth
          : ''}`}
      >
        <div className={styles.blockWidthConstrainer}>
          {this.props.children}
        </div>
        <div className={styles.closeButton}>
          <button onClick={this._close}>
            {this.props.closeText}
          </button>
        </div>
      </div>
    )
  }
}
