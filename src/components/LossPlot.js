import React from 'react'
import ReactDOM from 'react-dom'
import C3Chart from 'react-c3js'

const CD = (props) => {
  const avgLoss = props.avgLoss || []
  const data = {
    columns: [['loss', ...avgLoss]],
  }
  const drawRef = React.createRef()

  return (
    <C3Chart
      data={data}
      ref={drawRef}
      axis={{
        y: {
          max: 2,
          min: 0,
          // Range includes padding, set 0 if no padding needed
          // padding: {top:0, bottom:0}
        },
      }}
    />
  )
}

export default CD
