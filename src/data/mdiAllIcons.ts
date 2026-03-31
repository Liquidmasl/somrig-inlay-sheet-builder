import iconData from './mdiAllIconsData.json'
import type { IconOption } from './mdiIcons'

// iconData is an array of [name, path] tuples, pre-generated from @mdi/js
export const MDI_ALL_ICONS: IconOption[] = (iconData as [string, string][]).map(
  ([name, path]) => ({ name, path }),
)
