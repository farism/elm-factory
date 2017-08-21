import React, { PropTypes } from 'react'

export default function ConfigPropDoc({ prop }) {
  return (
    <div>
      <h1>
        {prop.name}
      </h1>
      <h2>Example</h2>
      <code>
        <pre>
          {JSON.stringify(prop.example, null, 2)}
        </pre>
      </code>
      <h2>Description</h2>
      {prop.description.map((s, index) => {
        if (typeof s === 'string') {
          return (
            <p key={index}>
              {s}
            </p>
          )
        }
        return s
      })}
      {prop.properties ? <h2 style={{ marginBottom: 0 }}>Properties</h2> : null}
      {prop.properties
        ? prop.properties.map((property, index) =>
            <div>
              <h3
                style={{
                  marginBottom: 0,
                  marginTop: index === 0 ? 0 : 'initial',
                }}
              >
                {property.name}
              </h3>
              <h4 style={{ marginTop: 0, marginBottom: 0 }}>
                <small>Type: </small>
                {property.type}
              </h4>
              <p>
                {property.description}
              </p>
            </div>
          )
        : null}
    </div>
  )
}

ConfigPropDoc.propTypes = {
  prop: PropTypes.shape({
    name: PropTypes.string.isRequired,
    module: PropTypes.string,
    example: PropTypes.object.isRequired,
    required: PropTypes.bool.isRequired,
    description: PropTypes.arrayOf(PropTypes.string).isRequired,
    properties: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        type: PropTypes.string,
        description: PropTypes.string,
      })
    ),
  }).isRequired,
}
