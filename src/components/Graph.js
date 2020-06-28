import React, {useContext} from 'react'
import NeuralContext from '../providers/NeuralProvider'
import {DataSet} from 'vis-data/peer/esm/vis-data'
import {Network} from 'vis-network/peer/esm/vis-network'
import _ from 'lodash'

import LossPlot from './LossPlot'

// import 'vis-network/styles/vis-network.css'

const options = {
  layout: {
    hierarchical: {
      direction: 'LR',
    },
  },
  edges: {
    color: '#ffffff',
  },
}

const events = {
  select: function (event) {
    var {nodes, edges} = event
    console.log('Selected nodes:')
    console.log(nodes)
    console.log('Selected edges:')
    console.log(edges)
  },
}

class MyGraph extends React.Component {
  constructor(props) {
    super(props)

    this.ref = null
    this.network = null
  }

  setRef = (element) => {
    this.ref = element
  }

  initNetwork = (data) => {
    if (this.ref) {
      this.network = new Network(this.ref, data, options)
    } else {
      console.warn('Component not ready.')
    }
  }

  componentDidMount() {
    // autofocus the input on mount
  }

  renderNode = (node, edges) => {
    return (
      <React.Fragment>
        {false && edges && edges.map(this.renderEdge)}
        <div key={node.id} style={{padding: 10, display: 'flex'}}>
          <div style={{padding: 10}}>node</div>
          <div style={{padding: 10}}>a: {node.activation.toFixed(2)}</div>
          <div style={{padding: 10}}>b: {node.bias.toFixed(2)}</div>
          <div style={{padding: 10}}>f: {node.flow.toFixed(2)}</div>
          <div style={{padding: 10}}>bf: {node.biasFlow.toFixed(2)}</div>
        </div>
      </React.Fragment>
    )
  }

  renderEdge = (edge) => {
    return (
      <div key={edge.id} style={{padding: 10, display: 'flex'}}>
        <div style={{padding: 10}}>w: {edge.weight.toFixed(2)}</div>
        <div style={{padding: 10}}>f: {edge.flow.toFixed(2)}</div>
        <div style={{padding: 10}}>from: {edge.from}</div>
        <div style={{padding: 10}}>to: {edge.to}</div>
      </div>
    )
  }

  renderLayer = (nodeLayer, edgeLayer, isCurrentLayer) => {
    // console.info('Renderlayer')
    return (
      <React.Fragment>
        <div>
          {isCurrentLayer && <div>current layer</div>}
          {nodeLayer.map((node, index) => {
            let edges = edgeLayer && edgeLayer[index]
            return this.renderNode(node, edges)
          })}
          <hr />
        </div>
      </React.Fragment>
    )
  }

  renderEdgeLayer = (edgeLayer) => {
    return <div style={{display: 'flex'}}>{edgeLayer.map(this.renderEdge)}</div>
  }

  drawCurrentInput = (currentInputData) => {
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
                  x
                </div>
              )
            })}
          </div>
        </div>
      )
    })
  }

  renderText = (nodeLayers, edgeLayers, currentLayerIndex) => {
    return nodeLayers.slice(1).map((nodeLayer, index) => {
      return (
        <React.Fragment key={index}>
          {this.renderLayer(
            nodeLayer,
            edgeLayers[index],
            index === currentLayerIndex,
          )}
        </React.Fragment>
      )
    })
  }

  renderGraph = (nodes, edges) => {
    if (!this.network) {
      setTimeout(() => {
        this.initNetwork({nodes: nodes, edges: edges})
      }, 0)
    } else {
      this.network.setData({nodes: nodes, edges: edges})
    }
    return (
      <div ref={this.setRef} style={{height: 800}}>
        this is the graph ref
      </div>
    )
  }

  renderCurrentOutput = (currentAnswer, currentExpectedAnswer) => {
    return (
      <div>
        Output (actual | expected):
        <div style={{display: 'flex', fontSize: '64px'}}>
          {currentAnswer}|{currentExpectedAnswer}
        </div>
      </div>
    )
  }

  render() {
    return (
      <NeuralContext.Consumer>
        {({
          nodes,
          edges,
          init,
          step,
          nodeLayers,
          edgeLayers,
          currentLayerIndex,
          loss,
          currentInputData,
          avgLoss,
          currentAnswer,
          currentExpectedAnswer,
        }) => {
          // let showGraph = nodeLayers && nodeLayers[0] && nodeLayers[0].length<10
          let showGraph = nodes && nodes.length < 30
          let showText =
            nodeLayers && nodeLayers[0] && nodeLayers[0].length > 10
          return (
            <React.Fragment>
              {true && <LossPlot avgLoss={avgLoss} />}
              <div>Input:</div>
              {this.drawCurrentInput(currentInputData)}
              {this.renderCurrentOutput(currentAnswer, currentExpectedAnswer)}
              {this.renderGraph(nodes, edges)}
              {showText &&
                this.renderText(nodeLayers, edgeLayers, currentLayerIndex)}
            </React.Fragment>
          )
        }}
      </NeuralContext.Consumer>
    )
  }
}

export default MyGraph
