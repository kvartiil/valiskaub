import { range, random } from "lodash-es"
import { Sample } from './commonTypes'

export type Activator = (x: number) => number

export type ActivatorPair = {
  fn: Activator
  derivative: Activator
}

export type TrainingParams =
  {
    learningRate: number
    layers: number[],
    activatorPair: ActivatorPair
  }

export class NeuralNetwork {
  props: TrainingParams
  neurons: Neuron[][]

  constructor(params: TrainingParams) {
    this.props = params
    const layers = params.layers

    this.neurons = layers.map((layer, layerIndex) =>
      range(0, layer).map(n =>
        new Neuron(layerIndex, n)
      )
    )

    for (var layer = 0; layer < layers.length - 1; layer++)
      for (var inner = 0; inner < layers[layer]; inner++)
        for (var outer = 0; outer < layers[layer + 1]; outer++)
          new Connection(this.neurons[layer][inner], this.neurons[layer + 1][outer])
  }

  traverseConnections(action: (c: Connection) => void) {
    for (var layer of this.neurons)
      for (var neuron of layer)
        for (var connection of neuron.outputConnections)
          action(connection)
  }

  numberOfOutputNeurons() {
    return this.props.layers[this.props.layers.length - 1]
  }

  outputNeuronValues() {
    return this.neurons[this.neurons.length - 1].map(n => n.output)
  }

  predictionIndex() {
    return this.outputNeuronValues().maxElementIndex(x => x)!
  }

  calcOutput(input: Uint8Array) {
    for (var i = 0; i < input.length; i++)
      this.neurons[0][i].output = input[i] / 256

    for (var layer of this.neurons.slice(1))
      for (var neuron of layer)
        neuron.calcOutput(this.props.activatorPair.fn)

    return this.outputNeuronValues()
  }

  learn(sample: Sample) {
    this.calcOutput(sample.input)
    this.calcLossesBackProp(sample.correctOutputIndex)
    this.recalibrate()
  }

  private calcLossesBackProp(correctOutputIndex: number) {
    for (var layer of this.neurons.slice(1).reverse())
      for (var neuron of layer)
        neuron.calcLossesBackProp(
          this.props.activatorPair.derivative,
          layer != this.neurons[this.neurons.length - 1] ? undefined :
            correctOutputIndex == neuron.index ? 1 : 0
        )
  }

  private recalibrate() {
    for (var layer of this.neurons.slice(1))
      for (var neuron of layer)
        neuron.recalibrate(this.props.learningRate)
  }
}

export class Neuron {
  layer: number
  index: number
  inputConnections: Connection[] = []
  outputConnections: Connection[] = []
  bias = 0
  biasedInputTotal = 0
  output = 0
  inputInfluenceOnLoss = 0
  outputInfluenceOnLoss = 0

  constructor(layer: number, index: number) {
    this.index = index
    this.layer = layer
    if (layer != 0)
      this.bias = jitter()
  }

  isInputNeuron() {
    return this.layer == 0
  }

  isOutputNeuron() {
    return !this.outputConnections.any()
  }

  calcOutput(activator: Activator) {
    this.biasedInputTotal = this.inputConnections.sum(x => x.weight * x.input.output) + this.bias
    this.output = activator(this.biasedInputTotal)
  }

  calcLossesBackProp(derivative: Activator, expected?: number) {
    this.outputInfluenceOnLoss =
      expected != null ?
        expected - this.output :
        this.outputConnections.sum(o => o.weight * o.output.inputInfluenceOnLoss)

    this.inputInfluenceOnLoss = this.outputInfluenceOnLoss * derivative(this.biasedInputTotal)
  }

  recalibrate(learningRate: number) {
    const nudge = this.inputInfluenceOnLoss * learningRate
    this.bias += nudge

    for (var i of this.inputConnections)
      i.weight += nudge * i.input.output
  }

  get id() {
    return `neuron-${this.layer}-${this.index}`
  }
}

export class Connection {
  weight = jitter()
  input: Neuron
  output: Neuron
  ui: any

  constructor(input: Neuron, output: Neuron) {
    this.input = input
    this.output = output
    input.outputConnections.push(this)
    output.inputConnections.push(this)
  }
}

export const relu: ActivatorPair = {
  fn: (x: number) => x < 0 ? x / 100 : x,
  derivative: (x: number) => x < 0 ? 0.01 : 1
}

export const jitter = () => random(-0.001, 0.001)