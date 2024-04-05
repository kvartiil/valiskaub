class Rect {
  constructor(public left: number, public top: number, public right: number, public bottom: number) { }
  get width() { return this.right - this.left }
  get height() { return this.bottom - this.top }
}

/**
 * Deep learning almost alwasys needs some data cleansing. In this, case we need to center the user's image,
 * since all the training data uses centered images, so the network won't recognize a non-centered image.
 */
export function extractCenteredImage(canvasId: string, width: number, height: number) {
  const canvas1 = document.getElementById(canvasId) as HTMLCanvasElement

  const canvas2 = document.createElement('canvas') as HTMLCanvasElement
  const ctx2 = canvas2.getContext("2d")!
  ctx2.clearRect(0, 0, width, height)
  ctx2.drawImage(canvas1, 0, 0, width, height)
  const bytes1 = getCanvasBytes(ctx2, width, height)
  const content = getContentCroppedBounds(bytes1, width, height)

  const canvas3 = document.createElement('canvas') as HTMLCanvasElement
  const ctx3 = canvas3.getContext("2d")!
  ctx3.clearRect(0, 0, width, height)
  ctx3.drawImage(canvas2,
    content.sourceCrop.left, content.sourceCrop.top, content.sourceCrop.width, content.sourceCrop.height,
    content.destCentered.left, content.destCentered.top, content.destCentered.right, content.destCentered.bottom)
  const bytes2 = getCanvasBytes(ctx3, width, height)
  return new Uint8Array(bytes2)
}

function getCanvasBytes(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const data = ctx.getImageData(0, 0, width, height)
  const bytes: number[] = []
  for (var i = 0; i < data.data.length; i += 4)
    bytes[i / 4] = data.data[i + 3]
  return bytes
}

/**
 * Returns source & destination rect, where all pixels outside bounds have value zero, and destination rect is centered
 * gratituously inefficient implementation, but this isn't called in a loop so we're fine
 */
function getContentCroppedBounds(bytes: number[], width: number, height: number) {
  const pixel = (x: number, y: number) => y * height + x
  var bounds = new Rect(width, height, 0, 0) // inverted bounds represents worst possible scenario

  for (var x = 0; x < width; x++)
    for (var y = 0; y < height; y++) {
      const p = bytes[pixel(x, y)]
      if (p) {
        if (x < bounds.left) bounds.left = x
        if (x >= bounds.right) bounds.right = x + 1
        if (y < bounds.top) bounds.top = y
        if (y >= bounds.bottom) bounds.bottom = y + 1
      }
    }

  return {
    sourceCrop: bounds,
    destCentered: new Rect(
      bounds.left + ((width - bounds.right) - bounds.left) / 2,
      bounds.top + ((height - bounds.bottom) - bounds.top) / 2,
      bounds.width,
      bounds.height
    )
  }
}
