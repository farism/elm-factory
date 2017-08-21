import React, { PropTypes } from 'react'

export default function ElmSVG({ width, height }) {
  return (
    <svg
      version="1.1"
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      width={`${width}px`}
      height={`${height}px`}
      viewBox="0 0 323.141 322.95"
    >
      <g>
        <polygon points="161.649,152.782 231.514,82.916 91.783,82.916" />
        <polygon points="8.867,0 79.241,70.375 232.213,70.375 161.838,0" />
        <rect
          x="192.99"
          y="107.392"
          transform="matrix(0.7071 0.7071 -0.7071 0.7071 186.4727 -127.2386)"
          width="107.676"
          height="108.167"
        />
        <polygon points="323.298,143.724 323.298,0 179.573,0" />
        <polygon points="152.781,161.649 0,8.868 0,314.432" />
        <polygon points="255.522,246.655 323.298,314.432 323.298,178.879" />
        <polygon points="161.649,170.517 8.869,323.298 314.43,323.298" />
      </g>
    </svg>
  )
}

ElmSVG.propTypes = {
  height: PropTypes.number,
  width: PropTypes.number,
}
