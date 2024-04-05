export class Sample {
  input: Uint8Array
  correctOutputIndex: number

  constructor(input: Uint8Array, correctOutputIndex: number) {
    this.input = input
    this.correctOutputIndex = correctOutputIndex
  }
}