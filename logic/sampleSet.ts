import { Sample } from "./commonTypes"
import { shuffle } from "lodash-es"

export class SampleSet {
  samples: Sample[] = []
  tally: boolean[] = []
  iterations = 0
  currentIndex = -1

  constructor(samples: Sample[] = []) {
    this.samples = samples
  }

  current() {
    return this.currentIndex == -1 ? undefined : this.samples[this.currentIndex]
  }

  next(isTraining: boolean) {
    this.iterations++
    if (isTraining && (this.currentIndex + 1 == this.samples.length))
      this.samples = shuffle(this.samples)
    this.currentIndex = (this.currentIndex + 1) % this.samples.length
    return this.samples[this.currentIndex]
  }

  reset() {
    this.tally = []
    this.currentIndex = -1
    this.iterations = 0
  }

  successRatio() {
    const chunkSize = 10000
    if (this.tally.length == chunkSize * 10)
      this.tally = this.tally.slice(this.tally.length - chunkSize)

    const length = Math.min(chunkSize, this.tally.length)
    const recent = this.tally.slice(this.tally.length - length)
    return recent.filter(x => x == true).length / length
  }

  recordIsSuccess(predictionIndex: number) {
    this.tally.push(predictionIndex == this.current()!.correctOutputIndex)
  }
}