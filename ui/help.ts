import { div, a, p } from "solenya"
import { theme } from "./theme"

export function help() {
  return div({ class: 'my-5', style: { color: theme.docTextColor } },
    p("This is a running live on StackBlitz so you can view and edit the source code ", a({ href: "https://stackblitz.com/edit/deep-learning?file=logic%2FneuralNetwork.ts" }, "here"), ". The actual neural network is less than 200 lines of code, using a basic back propagation algorithm."),
    p("When you click 'play' the neural network starts learning from 60,000 hand-written images of digits, courtesy of the ", a({ href: "http://yann.lecun.com/exdb/mnist/", target: "_blank" }, "the MNIST database"), "."
    ),
    p("The 'training' vs. 'testing' success indicates how many successful predictions the neural network makes on the 60,000 training images vs. another 10,000 test images that the network has no memory of."),
    p("You can play with the parameters at the top. By adding another layer, the network perhaps becomes more of a 'deep learning' network."),
    p("Every neuron connects to every other neuron in adjacent layers, but for clarity (and to not overwork your CPU!) only the strongest connections are displayed.")
  )
}