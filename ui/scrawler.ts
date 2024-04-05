import { fabric } from 'fabric'
import { canvas, Component, div, commandLink } from "solenya"
import { extractCenteredImage } from "../logic/imageProcessing"
import { theme } from './theme'
import { icon } from './commonUi'

export class Scrawler extends Component {
  isClear = true
  private fabricCanvas?: fabric.Canvas

  clear() {
    if (this.fabricCanvas) {
      this.fabricCanvas.clear()
      this.update(() => { this.isClear = true })
    }
  }

  view(controlHeight?: number, onStartSelection?: () => void, onFinishSelection?: (bytes: Uint8Array) => void) {
    return (
      div(
        canvas({
          key: "canvas",
          id: "canvas",
          width: controlHeight!,
          height: controlHeight!,
          style: <any>{ border: "1px solid #ddd" },
          onAttached: e => {
            this.onRefreshed(() => {
              this.fabricCanvas = new fabric.Canvas('canvas', { isDrawingMode: true }),
                this.fabricCanvas["freeDrawingBrush"].width = 20
              this.fabricCanvas.on("mouse:down", e => {
                onStartSelection!()
              }),
                this.fabricCanvas.on("path:created", e => {
                  onFinishSelection!(extractCenteredImage("canvas", 28, 28))
                  this.update(() => { this.isClear = false })
                })
            })
          }
        }),
        this.controls()
      )
    )
  }

  controls() {
    return (
      div({ style: { position: "relative" } },
        div({ style: { position: "absolute", bottom: "10px", left: "10px", zIndex: 1000 } },
          this.isClear ?
            div({ style: { color: theme.labelColor, width: "12rem" } }, "Draw a digit in this box when success reaches 90%.") :
            commandLink({ onclick: () => this.clear() }, icon("delete"))
        )
      )
    )
  }
}