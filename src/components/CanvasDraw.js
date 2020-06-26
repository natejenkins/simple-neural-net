import React from 'react'
import ReactDOM from 'react-dom'
import CanvasDraw from 'react-canvas-draw'

const CD = () => {
  const drawRef = React.createRef()
  const onChange = () => {
    console.info('changing')
    // console.info(drawRef)
    // console.info(drawRef.current.getSaveData())
    let imageData = drawRef.current.ctx.drawing.getImageData(0, 0, 128, 128)
    console.info(imageData)
  }
  let defaultProps = {
    onChange: onChange,
    loadTimeOffset: 5,
    lazyRadius: 30,
    brushRadius: 1,
    brushColor: '#444',
    catenaryColor: '#0a0302',
    gridColor: 'rgba(150,150,150,0.17)',
    hideGrid: false,
    canvasWidth: 128,
    canvasHeight: 128,
    disabled: false,
    imgSrc: '',
    saveData: null,
    immediateLoading: false,
    hideInterface: false,
  }
  return <CanvasDraw {...defaultProps} ref={drawRef} />
}

export default CD
