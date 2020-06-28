import React, {useState, useEffect, useRef} from 'react'
import _ from 'lodash'

const calcSigmoid = (z) => {
  return 1.0 / (1.0 + Math.exp(-z))
}

window.calcSigmoid = calcSigmoid

const calcZ = (inputs, edges, node) => {
  return (
    _.zip(inputs, edges)
      .map(([input, edge]) => input.activation * edge.weight)
      .reduce((a, b) => {
        return a + b
      }, 0.0) + node.bias
  )
}

const calcLoss = (outputNodes, answers) => {
  return _.zip(outputNodes, answers)
    .map(([outputNode, answer]) => Math.pow(outputNode.activation - answer, 2))
    .reduce((a, b) => {
      return a + b
    }, 0.0)
}

const calcLossGradient = (outputNodes, answers) => {
  return _.zip(outputNodes, answers).map(
    ([outputNode, answer]) => 2 * (answer - outputNode.activation),
  )
}

const calcEZ = (z) => {
  return Math.pow(Math.E, -z)
}

const adjustEdgeWeights = (edges, learningRate, batchSize) => {
  // console.info(edges)
  // return
  // debugger
  edges.forEach((edge) => {
    edge.weight += (edge.avgFlow * learningRate) / batchSize
  })
}

const adjustNodeBiases = (nodes, learningRate, batchSize) => {
  // console.info(nodes)
  // return
  nodes.forEach((node) => {
    node.bias += (node.avgBiasFlow * learningRate) / batchSize
  })
}

const zeroAverages = (nodes, edges) => {
  nodes.forEach((node) => {
    node.avgBiasFlow = 0
    node.avgFlow = 0
  })
  edges.forEach((edge) => {
    edge.avgFlow = 0
  })
}

const calculateOutput = (outputNodes, answers) => {
  let maxOutput = outputNodes[0].activation
  let maxOutputIndex = 0
  outputNodes.forEach((node, index) => {
    if (node.activation > maxOutput) {
      maxOutput = node.activation
      maxOutputIndex = index
    }
  })
  let maxAnswer = answers[0]
  let maxAnswerIndex = 0
  answers.forEach((answer, index) => {
    if (answer > maxAnswer) {
      maxAnswer = answer
      maxAnswerIndex = index
    }
  })
  return {answer: maxOutputIndex, expectedAnswer: maxAnswerIndex}
}

const NeuralContext = React.createContext({})

let nodes = []
let edges = []

let data = [
  [0, 0, 0],
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
]
let numDataInputs = data.length

let expectedOutputs = [
  [0, 0, 0],
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
]

let hiddenLayerSizes = [4, 6]
let layerSizes = [data[0].length]
  .concat(hiddenLayerSizes)
  .concat(expectedOutputs[0].length)
let numLayers = hiddenLayerSizes.length + 2

let layers = []
let edgeLayers = []
let i, j, k
let currentNodes = []
let nextNodes = []
let previousNodes = []
let currentEdges = []
let numNodes = 0
let id = 0
let node, label

let iteration = 0
let dataIndex = 0
let currentLayerIndex = 0
const FORWARD = 0
const BACKWARD = 1
let direction = FORWARD

let loss = '?'
let avgLoss = 0
let epoch = 0

let colors = {
  forward: 'red',
  baclward: 'blue',
}

let initialized = false
let rows = 3
let cols = 1
let totalSteps = 0
let currentAnswer = 0
let currentExpectedAnswer = 0
let avgLossArray = []
class NeuralProvider extends React.Component {
  state = {
    isRunning: false,
    updateGraphIndex: 0,
    learningRate: 0.1,
    batchSize: 1,
  }

  triggerUpdate = () => {
    setForceUpdate(Math.random())
  }

  setLearningRate = (newVal) => {
    let newFloatVal = parseFloat(newVal)
    this.setState({
      learningRate: newFloatVal,
    })
    // triggerUpdate()
  }
  setBatchSize = (newVal) => {
    let newIntVal = parseInt(newVal)
    this.setState({
      batchSize: newIntVal,
    })
  }
  init = () => {
    totalSteps = 0
    numDataInputs = data.length
    layerSizes = [data[0].length]
      .concat(hiddenLayerSizes)
      .concat(expectedOutputs[0].length)
    for (i = 0; i < numLayers; i++) {
      numNodes = layerSizes[i]
      layers[i] = []

      for (j = 0; j < numNodes; j++) {
        if (i === 0) {
          label = 'x' + j
        } else if (i === numLayers - 1) {
          label = 'y' + j
        } else {
          label = 'N'
        }
        node = {
          id: id++,
          level: i,
          label: label,
          font: {size: 24},
          activation: 0,
          flow: 0,
          bias: 0,
          biasFlow: 0,
          color: colors.init_color,
        }
        layers[i].push(node)
        nodes.push(node)
      }
    }
    for (i = 1; i < numLayers; i++) {
      currentNodes = layers[i]
      previousNodes = layers[i - 1]
      edgeLayers[i] = []
      for (j = 0; j < currentNodes.length; j++) {
        edgeLayers[i][j] = []
        for (k = 0; k < previousNodes.length; k++) {
          let weight = Math.random() * 0.01

          let edge = {
            from: previousNodes[k].id,
            to: currentNodes[j].id,
            level: i,
            label: 'w' + j + k,
            width: 4 * weight,
            weight: weight,
            flow: 0,
            color: 'black',
          }
          edges.push(edge)
          edgeLayers[i][j].push(edge)
        }
      }
    }
    zeroAverages(nodes, edges)
    avgLoss = 0.0
    avgLossArray = []
    console.info('Finished init')
  }

  toggleRun = () => {
    let {isRunning} = this.state
    this.setState({isRunning: !isRunning}, () => {
      setTimeout(this.step, 0)
    })
  }
  step = (event, numSteps = 100) => {
    if (!this.state.initialized) {
      this.init()
      this.setState({
        initialized: true,
      })
    }
    let {batchSize, learningRate, isRunning} = this.state

    _.range(isRunning ? numSteps : 1).forEach((s) => {
      totalSteps += 1
      if (direction === FORWARD) {
        // for the start of a forward pass load the data
        if (currentLayerIndex === 0) {
          layers[currentLayerIndex].forEach((node, index) => {
            node.activation = data[dataIndex][index]
            node.label = data[dataIndex][index].toFixed(2)
            node.color = colors.forward
          })
          currentLayerIndex += 1
        }
        //
        else {
          layers[currentLayerIndex].forEach((node, i) => {
            let z = calcZ(
              layers[currentLayerIndex - 1],
              edgeLayers[currentLayerIndex][i],
              node,
            )
            let sigmoid = calcSigmoid(z)
            let ez = calcEZ(z)
            node.activation = sigmoid
            node.label = sigmoid.toFixed(2)
            node.color = colors.forward
            node.z = z
            node.ez = ez
            node.s2ez = Math.pow(node.activation, 2) * ez
          })
          if (currentLayerIndex === numLayers - 1) {
            loss = calcLoss(
              layers[currentLayerIndex],
              expectedOutputs[dataIndex],
            )
            let output = calculateOutput(
              layers[currentLayerIndex],
              expectedOutputs[dataIndex],
            )
            currentAnswer = output.answer
            currentExpectedAnswer = output.expectedAnswer
            avgLoss += loss
            direction = BACKWARD
          }
          //
          else {
            currentLayerIndex += 1
          }
        }
      }
      //
      else if (direction === BACKWARD) {
        if (currentLayerIndex === numLayers) {
          currentLayerIndex -= 1
        }
        //
        else if (currentLayerIndex === numLayers - 1) {
          let lossGradient = calcLossGradient(
            layers[currentLayerIndex],
            expectedOutputs[dataIndex],
          )
          layers[currentLayerIndex].forEach((node, index) => {
            node.flow = lossGradient[index]
            node.avgFlow += node.flow
            node.color = colors.backward
            node.label = `a: ${node.activation.toFixed(
              2,
            )}\nf: ${node.flow.toFixed(2)}`
            node.biasFlow = node.flow * node.s2ez
            node.avgBiasFlow += node.biasFlow
          })

          currentLayerIndex -= 1
        }
        //
        else if (currentLayerIndex > -1) {
          layers[currentLayerIndex].forEach((node, index) => {
            // we need to transpose the edges to pick out each edge for the current node.
            // TODO: hold this transpose in memory so we don't have to do it every time.
            let edges = edgeLayers[currentLayerIndex + 1].map(
              (edgeLayer) => edgeLayer[index],
            )

            node.flow = 0
            layers[currentLayerIndex + 1].forEach((nextNode, k) => {
              let edge = edges[k]
              edge.flow = nextNode.flow * nextNode.s2ez * node.activation
              edge.avgFlow += edge.flow
              node.flow += nextNode.flow * nextNode.s2ez * edge.weight
              node.avgFlow += node.flow
            })
            node.biasFlow = node.flow * node.s2ez
            node.avgBiasFlow += node.biasFlow
            node.color = colors.backward
            node.label = `a: ${node.activation.toFixed(
              2,
            )}\nf: ${node.flow.toFixed(2)}`
          })

          if (currentLayerIndex === 0) {
            layers[currentLayerIndex].forEach((node, index) => {
              node.color = colors.backward
            })
            direction = FORWARD
            if (dataIndex % batchSize === 0) {
              adjustEdgeWeights(edges, learningRate, batchSize)
              edges.forEach((edge) => {
                edge.label = edge.weight.toFixed(2)
              })
              adjustNodeBiases(nodes, learningRate, batchSize)
              zeroAverages(nodes, edges)

              avgLossArray.push(avgLoss / batchSize)

              avgLoss = 0
            }
            dataIndex = (dataIndex + 1) % numDataInputs
            if (dataIndex === 0) {
              epoch += 1
            }
          } //
          else {
            currentLayerIndex -= 1
          }
        }
      }
    })
    if (isRunning) {
      setTimeout(this.step, 0)
      if (dataIndex % batchSize === 0) {
        this.setUpdateGraphIndex(totalSteps)
      }
    } //
    else {
      this.setUpdateGraphIndex(currentLayerIndex)
    }
  }

  setUpdateGraphIndex = (index) => {
    this.setState({
      updateGraphIndex: index,
    })
  }

  setTrainingData = (trainingData, numRows, numCols) => {
    let maxVal = _.max(trainingData)
    let normalized = trainingData.map((val) => val / maxVal)
    rows = numRows
    cols = numCols
    data = _.chunk(normalized, rows * cols)
    initialized = false
    this.setState({
      initialized: false,
      rows: numRows,
      cols: numCols,
      data: data,
    })
  }

  setLabelData = (labelData) => {
    expectedOutputs = labelData
  }

  render() {
    return (
      <NeuralContext.Provider
        value={{
          nodes: nodes,
          edges: edges,
          nodeLayers: layers,
          edgeLayers: edgeLayers,
          init: this.init,
          step: this.step,
          loss: loss,
          epoch: epoch,
          toggleRun: this.toggleRun,
          isRunning: this.state.isRunning,
          direction: direction === FORWARD ? 'forward' : 'backward',
          currentLayerIndex: currentLayerIndex,
          setTrainingData: this.setTrainingData,
          setLabelData: this.setLabelData,
          learningRate: this.state.learningRate,
          setLearningRate: this.setLearningRate,
          batchSize: this.state.batchSize,
          setBatchSize: this.setBatchSize,
          currentInputData: {
            data: data[dataIndex],
            rows: rows,
            cols: cols,
          },
          avgLoss: avgLossArray.slice(-200),
          currentExpectedAnswer: currentExpectedAnswer,
          currentAnswer: currentAnswer,
        }}>
        {this.props.children}
      </NeuralContext.Provider>
    )
  }
}

export {NeuralProvider}
export default NeuralContext
