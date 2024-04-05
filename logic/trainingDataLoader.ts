import { inflate } from 'pako'
import { Sample } from './commonTypes'

export async function loadBytes(url: string) {
  const response = await fetch(url)
  const buffer = await response.arrayBuffer()
  const array = new Uint8Array(buffer)
  return inflate(array)
}

export async function loadImageDataset(imagesUrl: string, labelsUrl: string) {
  const imagesBytes = await loadBytes(imagesUrl)

  const header = imagesBytes.slice(0, 16).reverse()
  const imgCount = byteArrayToLong(header.slice(8, 12))
  const rows = byteArrayToLong(header.slice(4, 8))
  const cols = byteArrayToLong(header.slice(0, 4))

  const labelsBytes = await loadBytes(labelsUrl)

  const imageSamples: Sample[] = []

  labelsBytes.slice(8).forEach((label, i) => {
    const from = rows * cols * i + header.length
    imageSamples.push(
      new Sample(
        imagesBytes.slice(from, from + rows * cols),
        label
      )
    )
  })

  return imageSamples
}

const byteArrayToLong = (bytes: Uint8Array) => {
  var value = 0
  for (var i = bytes.length - 1; i >= 0; i--)
    value = (value * 256) + bytes[i]

  return value;
}
