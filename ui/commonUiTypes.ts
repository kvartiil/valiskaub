import { NeuralNetwork} from '../logic/neuralNetwork'

export interface IMaster {
  neuralNetwork: NeuralNetwork
  isRunning: boolean
  isReady: boolean
}