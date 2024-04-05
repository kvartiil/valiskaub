import { Connection } from "../logic/neuralNetwork"
import { Component, transient, div, VElement, h, svg } from "solenya"
import { weightedColor } from "./commonUi"
import { OrientObj, orient } from "./orientation"
import { IMaster } from "./commonUiTypes"

type Point = {
  x: number,
  y: number
}

type ConnectPoint = {
  a: Point,
  b: Point
}

export class ConnectionsPresenter extends Component {
  @transient private master: IMaster
  private visibleWeightThreshold = 0.2
  private positionsCalculated = false
  private orientation!: OrientObj

  constructor(master: IMaster) {
    super()
    this.master = master
  }

  view(orientation?: OrientObj) {
    this.orientation = orientation!

    const connections: VElement[] = []
    if (this.positionsCalculated)
      this.master.neuralNetwork.traverseConnections(c => {
        if (Math.abs(c.weight) > this.visibleWeightThreshold)
          connections.push(this.connectionView(c))
      })
    else
      this.performPositioning()

    return svg({
      id: "connections",
      style: { position: "absolute" },
      width: "100%",
      height: "100%"
    },
      connections
    )
  }

  performPositioning() {
    if (!this.master.isReady)
      return

    this.onRefreshed(() => {
      requestAnimationFrame(() => {
        this.update(() => {
          this.positionsCalculated = true
          const parentRect = document.getElementById("connections")!.getBoundingClientRect()
          this.master.neuralNetwork.traverseConnections(c => {
            c.ui = this.calcConnectorLine(parentRect, c.input.id, c.output.id, c.input.isInputNeuron())
          })
        })
      })
    })
  }

  private connectionView(c: Connection) {
    return (
      h("line", {
        stroke: weightedColor(c.weight),
        x1: c.ui.a.x,
        y1: c.ui.a.y,
        x2: c.ui.b.x,
        y2: c.ui.b.y
      })
    )
  }

  private calcConnectorLine(parentRect: ClientRect | DOMRect, id1: string, id2: string, centerFirst: boolean): ConnectPoint {
    const el1 = document.getElementById(id1)!
    const el2 = document.getElementById(id2)!
    const r1 = el1.getBoundingClientRect()
    const r2 = el2.getBoundingClientRect()

    if (this.orientation.orientation == "horizontal") {
      const r1X = centerFirst ? (r1.left + r1.width / 2) : r1.right
      return ({
        a: ({ x: -parentRect.left + r1X, y: -parentRect.top + r1.top + r1.height / 2 }),
        b: ({ x: -parentRect.left + r2.left, y: -parentRect.top + r2.top + r2.height / 2 })
      })
    }
    else {
      const r1Y = centerFirst ? (r1.top + r1.height / 2) : r1.bottom
      return ({
        a: ({ y: -parentRect.top + r1Y, x: -parentRect.left + r1.left + r1.width / 2 }),
        b: ({ y: -parentRect.top + r2.top, x: -parentRect.left + r2.left + r2.width / 2 })
      })
    }
  }
}