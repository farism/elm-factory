import React, { PropTypes } from 'react'

export default function GuideDoc({ doc }) {
  return <div />
}

GuideDoc.propTypes = {
  doc: PropTypes.shape({
    title: PropTypes.string.isRequired,
    text: PropTypes.isRequired,
  }).isRequired,
}
