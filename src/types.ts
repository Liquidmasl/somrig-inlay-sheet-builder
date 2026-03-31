export type ActionType = 'single' | 'double' | 'hold'
export type IndicatorPosition = 'inner' | 'outer'
export type LineStyle = 'solid' | 'dashed' | 'dotted'

export interface SeparatorStyle {
  thickness: number   // stroke-width in mm (e.g., 0.3)
  color: string       // hex color
  style: LineStyle
}

export interface ActionZone {
  type: ActionType
  icon: string | null    // MDI icon path name (e.g., 'mdiLightbulb')
  iconSize: number       // px, default ~20
  iconColor: string      // hex color, default '#000000'
  iconRotation: number   // degrees, default 0
}

export interface PhysicalButton {
  zones: ActionZone[]    // 1-3 zones
  indicatorPosition: IndicatorPosition  // 'inner' = towards center divider, 'outer' = away from center
}

export interface ButtonInlay {
  id: string
  top: PhysicalButton
  bottom: PhysicalButton
  horizontalSeparator: SeparatorStyle
  verticalSeparator: SeparatorStyle
}

export interface Sheet {
  id: string
  name: string
  buttons: ButtonInlay[]  // grid of buttons to print
}
