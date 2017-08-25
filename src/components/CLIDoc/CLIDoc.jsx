import React, { PropTypes } from 'react'

import BashBlock, { Comment, Gap, Line } from '../BashBlock'

export default function CLIDoc({ doc }) {
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
        : <BashBlock fullWidth>
            {doc.options.map(opt => {
              const stringOrNot =
                typeof opt.default === 'string'
                  ? `"${opt.default}"`
                  : opt.default

              const defaultOrRequired =
                typeof opt.default !== 'undefined'
                  ? `default: ${stringOrNot}`
                  : 'required'

              return (
                <span key={opt.name}>
                  <Line value={`-${opt.name}`} />
                  <Comment
                    value={`${opt.description} [${defaultOrRequired}]`}
                  />
                  <Gap />
                </span>
              )
            })}
          </BashBlock>}
    </div>
  )
}

CLIDoc.propTypes = {
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
