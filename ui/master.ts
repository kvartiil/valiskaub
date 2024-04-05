import { NeuralNetwork, Neuron, relu, TrainingParams } from '../logic/neuralNetwork'
import { Sample } from '../logic/commonTypes'
import { SampleSet } from '../logic/sampleSet'
import { loadImageDataset } from '../logic/trainingDataLoader'
import { a, commandLink, Component, div, span, h1, p, img, Label, PropertyRef, VElement, svg, h } from 'solenya'
import { layoutClass, layoutContentClass, layoutFooterClass, layoutHeaderClass } from './layout'
import { brightColor, icon, labeledValue, literalOptions, myButton, simpleSelector, weightedColor } from './commonUi'
import { orient, OrientObj } from "./orientation"
import { IMaster } from './commonUiTypes'
import { ConnectionsPresenter } from './connectionsPresenter'
import { Scrawler } from './scrawler'
import { theme } from './theme'
import { help } from './help'
import { shuffle } from 'lodash-es'
import * as bowser from "bowser"

export class Master extends Component implements IMaster {
  neuralNetwork!: NeuralNetwork
  stepsPerAnimation = 1000
  _hiddenLayer1NeuronCount = 20
  _hiddenLayer2NeuronCount = 0
  _learningRate = 0.01
  isRunning = false
  trainingSet = new SampleSet()
  testingSet = new SampleSet()
  manualPrediction: number[] = []
  scrawler = new Scrawler()
  connectionsPresenter = new ConnectionsPresenter(this)
  inputImageSize = 28
  controlSize = 280
  wasRunningBeforeScrawling = false
  orientation = getOrientObj()

  async attached(deserializing: boolean) {
    this.initialiseNeuralNetwork()
    if (isBrowserSupported) {
      const prefix = "https://s3.eu-west-2.amazonaws.com/solenya-media/"
      const trainingSamples = await loadImageDataset(prefix + "train-images-idx3-ubyte.gz", prefix + "train-labels-idx1-ubyte.gz")
      const testingSamples = await loadImageDataset(prefix + "t10k-images-idx3-ubyte.gz", prefix + "t10k-labels-idx1-ubyte.gz")

      this.update(() => {
        this.trainingSet = new SampleSet(trainingSamples)
        this.testingSet = new SampleSet(testingSamples)
      })
    }
    window.addEventListener('resize', e =>
      this.update(() => {
        this.connectionsPresenter.performPositioning()
        this.orientation = getOrientObj()
      })
    )
  }

  get isReady() {
    return this.testingSet && this.testingSet.samples.length > 0
  }

  initialiseNeuralNetwork() {
    const props = <TrainingParams>{
      layers: [this.inputImageSize * this.inputImageSize, this.hiddenLayer1NeuronCount, this.hiddenLayer2NeuronCount, 10].filter(n => n != 0),
      learningRate: this.learningRate,
      activatorPair: relu
    }
    this.update(() => {
      this.neuralNetwork = new NeuralNetwork(props)
      this.trainingSet.reset()
      this.testingSet.reset()
      this.update(() => {
        this.connectionsPresenter.performPositioning()
      })
    })
  }

  @Label("Hidden Layer 1")
  get hiddenLayer1NeuronCount() { return this._hiddenLayer1NeuronCount }

  set hiddenLayer1NeuronCount(value: number) {
    this._hiddenLayer1NeuronCount = value
    this.initialiseNeuralNetwork()
  }

  @Label("Hidden Layer 2")
  get hiddenLayer2NeuronCount() { return this._hiddenLayer2NeuronCount }

  set hiddenLayer2NeuronCount(value: number) {
    this._hiddenLayer2NeuronCount = value
    this.initialiseNeuralNetwork()
  }

  get learningRate() {
    return this._learningRate
  }

  set learningRate(value: number) {
    this._learningRate = value
    this.initialiseNeuralNetwork()
  }

  manualPredictionIndex() {
    return this.manualPrediction.maxElementIndex(x => x)
  }

  isManualPredictionCorrect(neuron: Neuron) {
    return neuron.isOutputNeuron() && neuron.index == this.manualPredictionIndex()
  }

  manuallyPredict(bytes: Uint8Array) {
    this.update(() => {
      this.manualPrediction = this.neuralNetwork.calcOutput(bytes)
      this.connectionsPresenter.performPositioning()
      if (this.wasRunningBeforeScrawling)
        this.isRunning = true
    })
  }

  onStartScrawl() {
    this.update(() => {
      this.wasRunningBeforeScrawling = this.isRunning
      this.isRunning = false
    })
  }

  isCurrentOutputCorrect() {
    return this.neuralNetwork.predictionIndex() == this.testingSet.current()!.correctOutputIndex
  }

  step() {
    this.update(() => {
      for (var n = 0; n < this.stepsPerAnimation; n++) {
        this.neuralNetwork.learn(this.trainingSet.next(true))
        this.trainingSet.recordIsSuccess(this.neuralNetwork.predictionIndex())
        if (n % 13 != 0) {
          this.neuralNetwork.calcOutput(this.testingSet.next(false).input)
          this.testingSet.recordIsSuccess(this.neuralNetwork.predictionIndex())
        }
      }
    })
  }

  toggleIsRunning() {
    this.update(() => {
      this.isRunning = !this.isRunning
    })
  }

  waitView() {
    return (
      div({ class: "d-flex flex-column align-items-center justify-content-center", style: { width: "100vw" } },
        div("Downloading image training data... It's about 10 megs so please be patient if you have a slow connection."),
        img({ class: "mt-3", src: "https://s3.eu-west-2.amazonaws.com/solenya-media/wait.gif" })
      )
    )
  }
  

  view(): VElement {
    if (!isBrowserSupported)
      return div("Please use Chrome or Firefox. This deep learning network runs in your browser so it's too processor intensive for Edge/IE.")

    if (!this.trainingSet.samples.length)
      return this.waitView()

    if (this.isRunning)
      requestAnimationFrame(() => this.step())

    return (
      div({ class: layoutClass },
        div({ class: layoutHeaderClass + " py-2 px-2", style: { backgroundColor: "#444", color: "white" } },
          div({ class: "container" },
            h1({ style: { color: "lime" } }, "Väliskaubanduse masinõpe"),
            p("Recognise handwritten digits with a neural network running locally in your browser.")
          )
        ),
        div({ class: layoutContentClass },
          div({ style: { backgroundColor: theme.controlStripColor } },
            div({ class: "container" },
              this.controlPanelView()
            )
          ),
          div({ class: "container" },
            div({ class: "d-flex mt-3 " + this.orientation.flexDirection },
              this.orientation.orientation == "horizontal" ?
                [this.scrawlerView(), this.neuralNetworkView()] :
                [this.neuralNetworkView(), this.scrawlerView()],
              this.manualPredictionView()
            ),
            help()
          )
        ),
        div({ class: layoutFooterClass, style: { backgroundColor: "#444", color: "white", fontSize: "smaller" } },
          div({ class: "container d-flex align-items-center", style: { minHeight: "70px" } },
            div({ class: "my-3" },
              div({ class: "my-1" }, "Written with ", a({ href: "https://github.com/solenya-group/solenya", class: brightColor }, "Solenya"), "."),
              div({ class: "my-1" }, "This sample leverages coding ideas from LINQPad's Neural Network sample & UI ideas from Google's Tensor Flow Playground.")
            )
          )
        )
      )
    )
  }

  scrawlerView() {
    return (
      div({ class: this.orientation.endMargin(3) },
        this.scrawler.view(this.controlSize, () => this.onStartScrawl(), bytes => this.manuallyPredict(bytes))
      )
    )
  }

  manualPredictionView() {
    return div({ style: { fontSize: "2000%", lineHeight: "0.75" } }, this.manualPredictionIndex())
  }

  controlPanelView() {
    return (
      div({ class: "d-flex flex-wrap align-items-center py-3", style: { margin: "0 -1.5rem" } },
        [
          this.playControls(),
          this.statisticViews().map(x => div({ class: "mx-2" }, x)),
          this.parameterSelectors().map(x => div({ class: "mx-2" }, x))
        ]
          .map(x => div({ class: "d-flex align-items-center flex-wrap mx-3" }, x))
      )
    )
  }

  playControls() {
    return [
      commandLink({ onclick: e => this.toggleIsRunning() },
        icon({ style: { fontSize: "400% !important" } }, this.isRunning ? "pause_circle_filled" : "play_circle_filled")
      ),
      commandLink({ onclick: e => this.step() }, icon("exposure_plus_1")),
      commandLink({ onclick: () => this.initialiseNeuralNetwork() }, icon("delete"))
    ]
  }

  statisticViews() {
    return [
      labeledValue("Steps", this.trainingSet.iterations),
      labeledValue("Training / Testing Success",
        div(
          this.successRatioView(this.trainingSet),
          " / ",
          this.successRatioView(this.testingSet)
        )
      )
    ]
  }

  successRatioView(sample: SampleSet) {
    if (!sample.tally.length)
      return "0%"
    const successRatio = sample.successRatio()
    return span({ style: { color: successRatio > 0.9 ? theme.primary : "red" } },
      (successRatio * 100).toFixed(1) + "%"
    )
  }

  parameterSelectors() {
    return [
      simpleSelector(this, () => this.stepsPerAnimation, literalOptions([1, 10, 100, 1000])),
      simpleSelector(this, () => this.learningRate, literalOptions([0.001, 0.003, 0.01, 0.03, 0.1])),
      this.layerSelector(() => this.hiddenLayer1NeuronCount),
      this.layerSelector(() => this.hiddenLayer2NeuronCount)
    ]
  }

  layerSelector(prop: PropertyRef<number>) {
    return simpleSelector(this, prop, [0, 10, 20, 50].map(n => ({
      value: n,
      label: n == 0 ? "No Layer" : n + " neurons"
    })))
  }

  neuralNetworkView() {
    const o = this.orientation
    return div({ class: `d-flex flex-grow-1 ${o.flexDirection} ${o.startMargin(3)} ${o.endMargin(3)}`, style: { position: "relative" } },
      div({ class: `d-flex ${o.flexDirection} ${o.endMargin(3)}` }, this.inputLayerView()),
      div({ class: `d-flex flex-grow-1 justify-content-between ${o.flexDirection}`, style: { width: this.controlSize, height: this.controlSize } },
        this.neuralNetwork.neurons.slice(1).map(layer =>
          div({ class: `d-flex justify-content-between ${o.pivot.flexDirection}` },
            layer.map(neuron => this.neuronView(neuron, layer.length))
          )
        )
      ),
      this.connectionsPresenter.view(this.orientation)
    )
  }

  inputLayerView() {
    const neurons = this.neuralNetwork.neurons[0]
    const rows: VElement[] = []
    for (var x = 0; x < this.inputImageSize; x++) {
      const neuronRow = neurons.slice(x * this.inputImageSize, (x + 1) * this.inputImageSize)
      rows.push(
        div({ class: "d-flex " + this.orientation.pivot.flexDirection },
          neuronRow.map((neuron, index) =>
            svg({ id: neuron.id, width: "10px", height: "10px", class: "d-flex" },
              h("circle", {
                cx: 5,
                cy: 5,
                r: 4.5,
                fill: "white",
                stroke: "gray"
              })
            )
          )
        )
      )
    }
    return rows
  }

  neuronView(neuron: Neuron, neuronsInLayerCount: number) {
    const size = "" + (this.controlSize / neuronsInLayerCount) + "px"

    return div({
      id: neuron.id,
      class: "flex-grow-1",
      style: {
        textAlign: "center",
        border: "1px solid #444",
        backgroundColor: weightedColor(neuron.bias),
        color: "white",
        width: size,
        height: size,
        borderRadius: "50%"
      }
    },
      neuron.isOutputNeuron() ? neuron.index : undefined
    )
  }
}

const isBrowserSupported = !(bowser.msie || bowser.msedge)

const getOrientObj = () => orient(window.innerWidth >= 768 ? "horizontal" : "vertical")