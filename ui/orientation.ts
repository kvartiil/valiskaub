export type OrientObjProps = {
  orientation: "horizontal" | "vertical"
  flexDirection : string
  startMargin (n: number) : string
  endMargin (n: number) : string
}

const horizontalOrientObj = <OrientObjProps>{
  orientation: "horizontal",
  flexDirection : "flex-row",
  startMargin: n => `ml-${n}`,
  endMargin: n => `mr-${n}`
}

const verticalOrientObj = <OrientObjProps>{
  orientation: "vertical",
  flexDirection : "flex-column",
  startMargin: n => `mt-${n}`,
  endMargin: n => `mb-${n}`
}

export type OrientObj = OrientObjProps & {
  pivot: OrientObjProps
}

export const orient = (orientation: "horizontal" | "vertical"): OrientObj =>
  orientation == "horizontal" ?
    { ...horizontalOrientObj, pivot: verticalOrientObj } :
    { ...verticalOrientObj, pivot: horizontalOrientObj }