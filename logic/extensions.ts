interface Array<T> {
  any(filter?: (val: T) => boolean): boolean
  maxElement(mapper: (val: T) => number): number | undefined
  maxElementIndex(mapper: (val: T) => number): number | undefined
  sum(mapper: (val: T) => number): number
}

Array.prototype.any = function <T>(filter?: (val: T) => boolean) {
  if (!filter)
    return this.length > 0

  const source = this

  for (var i = 0; i < source.length; i++)
    if (filter(source[i]))
      return true

  return false
}

Array.prototype.maxElement = function <T>(mapper: (val: T) => number) {

  const source = this
  var max: number | undefined = undefined

  for (var x of source)
    if (!max || mapper(x) > max)
      max = mapper(x)

  return max
}

Array.prototype.maxElementIndex = function <T>(mapper: (val: T) => number) {

  const source = this
  const max = source.maxElement(mapper)
  return max == null ? undefined : source.indexOf(max)
}

Array.prototype.sum = function <T>(mapper: (val: T) => number) {

  const source = this
  var total = 0

  for (var x of source)
    total += mapper(x)

  return total
}