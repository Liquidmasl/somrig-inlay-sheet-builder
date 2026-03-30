export type ActionType = 'single' | 'double' | 'hold'

export interface ActionZone {
  type: ActionType
  icon: string | null    // MDI icon path name (e.g., 'mdiLightbulb')
  iconSize: number       // px, default ~20
  iconColor: string      // hex color, default '#000000'
}

export interface PhysicalButton {
  zones: ActionZone[]    // 1-3 zones
}

export interface ButtonInlay {
  id: string
  top: PhysicalButton
  bottom: PhysicalButton
}

export interface Sheet {
  id: string
  name: string
  buttons: ButtonInlay[]  // grid of buttons to print
}
