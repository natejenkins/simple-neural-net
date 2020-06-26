import React, {useContext} from 'react'
import {makeStyles} from '@material-ui/core/styles'
import Drawer from '@material-ui/core/Drawer'
import Divider from '@material-ui/core/Divider'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import TextField from '@material-ui/core/TextField'
import InboxIcon from '@material-ui/icons/MoveToInbox'
import MailIcon from '@material-ui/icons/Mail'
import List from '@material-ui/core/List'

import NeuralContext from '../providers/NeuralProvider'

const drawerWidth = 240

const useStyles = makeStyles((theme) => ({
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
  },
}))

const MyDrawer = () => {
  const classes = useStyles()
  const {
    nodes,
    edges,
    init,
    step,
    loss,
    epoch,
    direction,
    toggleRun,
    isRunning,
    setTrainingData,
    setLabelData,
    learningRate,
    learningRateRef,
    setLearningRate,
    setLearningRateRef,
    batchSizeRef,
    setBatchSizeRef,
    currentInputData,
  } = useContext(NeuralContext)

  const handleTrainingFileInput = (event) => {
    const file = event.target.files[0]
    console.log(file)
    const reader = new FileReader()
    reader.addEventListener('load', (event) => {
      console.info('TRAINING FILE LOADED')
      let arrayBuffer = reader.result
      let view = new DataView(arrayBuffer)

      // mnist files are big endian
      let littleEndian = false
      let magicNumber = view.getInt32(0, littleEndian)
      let numImages = view.getInt32(4, littleEndian)
      let numRows = view.getInt32(8, littleEndian)
      let numCols = view.getInt32(12, littleEndian)
      console.info([magicNumber, numImages, numRows, numCols])
      let data = new Uint8Array(arrayBuffer.slice(16))

      setTrainingData(Array.from(data), numRows, numCols)
    })
    reader.readAsArrayBuffer(file)
  }

  const handleLabelFileInput = (event) => {
    const file = event.target.files[0]
    const reader = new FileReader()
    reader.addEventListener('load', (event) => {
      console.info('LABEL FILE LOADED')
      let arrayBuffer = reader.result
      let view = new DataView(arrayBuffer)

      // mnist files are big endian
      let littleEndian = false
      let magicNumber = view.getInt32(0, littleEndian)
      let numLabels = view.getInt32(4, littleEndian)

      let data = new Uint8Array(arrayBuffer.slice(8))
      let numbers = _.range(10)
      let binaryData = Array.from(data).map((val) => {
        return numbers.map((n, i) => (val === i ? 1 : 0))
      })

      setLabelData(binaryData)
    })
    reader.readAsArrayBuffer(file)
  }

  const drawCurrentInput = (currentInputData) => {
    let {data, rows, cols} = currentInputData
    return _.range(rows).map((row) => {
      return (
        <div>
          <div key={row} style={{display: 'flex', lineHeight: '10px'}}>
            {_.range(cols).map((col) => {
              let color = Math.floor(255 * data[row * cols + col])
              return (
                <div
                  key={col}
                  style={{
                    backgroundColor: `rgb(${color},${color},${color})`,
                    width: '10px',
                  }}>
                  a
                </div>
              )
            })}
          </div>
        </div>
      )
    })
  }

  return (
    <Drawer
      className={classes.drawer}
      variant="permanent"
      classes={{
        paper: classes.drawerPaper,
      }}
      anchor="left">
      <div className={classes.toolbar} />
      <Divider />
      <List>
        <ListItem button key={'init'} onClick={init}>
          <ListItemText primary={'INITIALIZE'} />
        </ListItem>
        <ListItem button key={'run'} onClick={toggleRun}>
          <ListItemText primary={isRunning ? 'STOP' : 'RUN'} />
        </ListItem>
        <ListItem button key={'step'} onClick={step}>
          <ListItemText primary={'STEP'} />
        </ListItem>
        <ListItem key={'loss'}>
          <ListItemText
            primary={
              'LOSS: ' + (typeof loss === 'number' ? loss.toFixed(2) : loss)
            }
          />
        </ListItem>
        <ListItem key={'epoch'}>
          <ListItemText primary={'epoch: ' + epoch} />
        </ListItem>
        <ListItem key={'direction'}>
          <ListItemText primary={'direction: ' + direction} />
        </ListItem>
        <ListItem key={'training file'}>
          <input type="file" onChange={handleTrainingFileInput} />
        </ListItem>
        <ListItem key={'label file'}>
          <input type="file" onChange={handleLabelFileInput} />
        </ListItem>
        <ListItem key={'learning rate'}>
          <TextField
            id="standard-basic"
            label="Learning Rate"
            value={learningRateRef.current}
            onChange={(event) => {
              console.info('SETTING LEARNING RATE')
              setLearningRateRef(event.target.value)
            }}
          />
        </ListItem>
        <ListItem key={'batch size'}>
          <TextField
            id="standard-basic"
            label="Batch Size"
            value={batchSizeRef.current}
            onChange={(event) => {
              setBatchSizeRef(event.target.value)
            }}
          />
        </ListItem>

        {drawCurrentInput(currentInputData)}
      </List>
    </Drawer>
  )
}

export default MyDrawer
