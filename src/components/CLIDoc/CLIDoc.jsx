import React, { PureComponent, PropTypes } from 'react'

import BashBlock, { Comment, Line } from '../BashBlock'

// import styles from './CLIDoc.scss';

export default class CLIDoc extends PureComponent {
  static propTypes = {
    doc: PropTypes.shape({
      command: PropTypes.string.isRequired,
      description: PropTypes.arrayOf(PropTypes.string).isRequired,
      usage: PropTypes.arrayOf(
        PropTypes.shape({
          line: PropTypes.string,
          comment: PropTypes.string,
        })
      ).isRequired,
      options: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string.isRequired,
          description: PropTypes.string.isRequired,
          value: PropTypes.bool,
        })
      ).isRequired,
    }).isRequired,
  }

  render() {
    const { doc } = this.props

    return (
      <div>
        <h1>
          {doc.command}
        </h1>
        <h2>Usage</h2>
        <BashBlock fullWidth>
          {doc.usage.map((use, index) => {
            if (use.comment) {
              return <Comment key={index} value={use.comment} />
            } else if (use.line) {
              return <Line key={index} value={use.line} />
            }
            return null
          })}
        </BashBlock>
        <h2>Description</h2>
        {doc.description.map((s, index) =>
          <p key={index}>
            {s}
          </p>
        )}
        <h2>Options</h2>
        {doc.options.length === 0
          ? <i>No Options</i>
          : doc.options.map(arg =>
              <div key={arg.name}>
                <h3>
                  --{arg.name}
                  {arg.value ? '=[value]' : ''}
                </h3>
                <p>
                  {arg.description}
                </p>
              </div>
            )}
      </div>
    )
  }
}
