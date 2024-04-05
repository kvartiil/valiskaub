import { button, HValue, i, PropertyRef, InputProps, VElement, getFriendlyName, getPropertyKey, div, label, Component, selector, a, SelectOption } from "solenya"
import { theme } from "./theme"
import { style } from "typestyle"
import { Connection, NeuralNetwork } from "../logic/neuralNetwork"
import pSBC from 'shade-blend-color'
import { clamp } from "lodash-es"

export const weightedColor = (x: number) => {
  const normalizedWeight = clamp(Math.abs(x), 0, 1)
  return pSBC(normalizedWeight, "#a0a0a0", x > 0 ? "#00ff00" : "#ff0000")
}

export const myButton = (...values: HValue[]) =>
  button({ class: "btn btn-outline-primary", type: "button" }, ...values)

export const icon = (...values: HValue[]) =>
  i({ class: "material-icons" }, ...values)

export interface InputUnitProps { }

export function inputUnit<T>
  (
  target: Component,
  prop: PropertyRef<T>,
  createInput: (props: InputProps<T>) => VElement,
  props: InputUnitProps = {}
  ) {
  const labelStr = getFriendlyName(target, prop)
  const id = getPropertyKey(prop)

  return div({ style: { minWidth: theme.minControlWidth } },
    myLabel({ for: id }, labelStr),
    createInput({
      target,
      prop,
      attrs: {
        id: id,
        class: "form-control"
      }
    })
  )
}

export const simpleSelector = <T extends string | number>(target: Component, prop: PropertyRef<T>, options: SelectOption<T>[]) =>
  inputUnit(target, prop, props => selector<T>({
    ...props,
    options: options,
    attrs: { class: "form-control" }
  }))

export const literalOptions = <T extends string | number>(options: T[]) =>
  options.map(x => <SelectOption<T>>{ label: "" + x, value: x })

export const brightColor = style({
  color: "lime",
  $nest: {
    "&:hover": {
      color: "lime"
    }
  }
})

export const myLabel = (...values: HValue[]) =>
  label({ style: { fontSize: "smaller", color: theme.labelColor } }, ...values)

export const labeledValue = (lbl: string, value: HValue) =>
  div({ style: { minWidth: "4rem" } },
    div(myLabel(lbl)),
    div({ class: "d-flex align-items-center", style: { height: "calc(2.25rem + 2px)", fontWeight: "bold", color: theme.valueColor } }, value)
  )