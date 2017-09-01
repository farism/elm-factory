import React, { PropTypes } from 'react'
import Markdown from 'react-markdown'

export default function GuideDoc({ doc }) {
  return (
    <article className="markdown-body">
      <Markdown source={doc.text} />
    </article>
  )
}

GuideDoc.propTypes = {
  doc: PropTypes.shape({
    title: PropTypes.string.isRequired,
    text: PropTypes.isRequired,
  }).isRequired,
}
