# Building layout links

This guide is for AI assistants and scripts. A layout link opens the inlay builder at <https://somrig.marcel1.com> and appends generated buttons to the visitor's current sheet.

```text
https://somrig.marcel1.com/#layout=<URL-encoded JSON>
```

Existing buttons stay on the sheet. New buttons use the sheet's button type, so for BILRESA the user selects BILRESA on the site. The JSON has no field for this.

## Format

```json
{
  "v": 1,
  "buttons": [
    {
      "top": [{ "type": "single", "icon": "mdi:lightbulb", "label": "Light" }],
      "bottom": [{ "type": "single", "icon": "mdi:lightbulb-off" }]
    }
  ]
}
```

- `v` must be `1`.
- `buttons` needs at least one button. Each button is one physical inlay.
- `top` and `bottom` are both required and hold 1 to 3 zones each.
- An empty half is `[{ "type": "none" }]`.

| Zone field | Value | Default |
|---|---|---|
| `type` | `single`, `double`, `hold`, `none` | by position: `single`, `hold`, `double` |
| `icon` | Material Design Icons name, such as `mdi:lightbulb`, or `null` | no icon |
| `iconSize` | number, mm | `12` |
| `iconColor` | `#rrggbb` | `#000000` |
| `iconRotation` | number, degrees | `0` |
| `label` | string | no label |
| `labelSize` | number, mm | `3` |
| `labelColor` | `#rrggbb` | icon color |
| `labelRotation` | number, degrees | `0` |
| `labelPosition` | `below`, `above` | `below` |
| `labelShiftIcon` | boolean | `false` |

Always set `type`. The positional default gives a second zone `hold`, so a half with single and double press comes out wrong without it.

Icons must be names. SVG path data is rejected. Browse names at <https://pictogrammers.com/library/mdi/>.

## From an existing Home Assistant button

Read the automation that handles the button. For the `somrig_room_lights` blueprint, use `ha_config_get_automation` and read `use_blueprint.input`. Only the gestures listed in `input.gestures` are active.

| Gesture | Goes to |
|---|---|
| `btn1_*` | `top` |
| `btn2_*` | `bottom` |
| `*_short_release` | `"type": "single"` |
| `*_double_press` | `"type": "double"` |
| `*_long_press` | `"type": "hold"` |

Treat `btn1` as the top half unless the user says the button is mounted the other way round.

Create one zone per active gesture. Choose the icon and label from what the gesture does: the automation `description`, the target entity or area, and the scene name. Keep labels short, around 8 characters, because the inlay is small.

For example, this automation input:

```yaml
gestures: [btn1_short_release, btn1_double_press, btn1_long_press, btn2_short_release, btn2_double_press]
btn1_short_release: # script.area_toggle, area living_room, on_scene stage_2
btn1_double_press:  # scene.livingroom_stage_1, "Cozy"
btn1_long_press:    # scene.livingroom_stage_3, "Bright"
btn2_short_release: # script.area_toggle, area vorzimmer
btn2_double_press:  # light.toggle, light.abstellkammer_light
```

becomes this layout:

```json
{
  "v": 1,
  "buttons": [
    {
      "top": [
        { "type": "single", "icon": "mdi:sofa", "label": "Wohnz." },
        { "type": "double", "icon": "mdi:candle", "label": "Cozy" },
        { "type": "hold", "icon": "mdi:white-balance-sunny", "label": "Bright" }
      ],
      "bottom": [
        { "type": "single", "icon": "mdi:door", "label": "Vorz." },
        { "type": "double", "icon": "mdi:broom", "label": "Abst." }
      ]
    }
  ]
}
```

## Encoding the link

The JSON must be URL-encoded. Characters like `#`, `&` and umlauts break the link otherwise.

### With a Home Assistant template

Use this when the link belongs in HA, or when values should come from HA state. In a markdown card:

```jinja
{% set layout = {"v": 1, "buttons": [{
  "top": [{"type": "single", "icon": "mdi:lightbulb", "label": area_name("light.abstellkammer_light")}],
  "bottom": [{"type": "none"}]
}]} %}
[Open layout](https://somrig.marcel1.com/#layout={{ layout | to_json | urlencode }})
```

To get the finished link without adding a card, render the same template with the `ha_eval_template` tool or in the HA template editor.

### Without a template

Save the JSON as `layout.json`, then run:

```bash
python3 -c 'import json, sys, urllib.parse as u; print("https://somrig.marcel1.com/#layout=" + u.quote(json.dumps(json.load(sys.stdin), ensure_ascii=False), safe=""))' < layout.json
```

In JavaScript:

```js
const url = `https://somrig.marcel1.com/#layout=${encodeURIComponent(JSON.stringify(layout))}`
```

## Checking the result

Give the user the link and ask them to open it. Each time the link is opened, it adds its buttons again. Reloading the page afterwards doesn't, because the site clears the link from the address bar after reading it.

If anything is invalid, nothing is added and a red banner names the problem:

| Banner text | Fix |
|---|---|
| `unknown icons: mdi:x` | The name doesn't exist. Check it in the icon library |
| `it is not valid JSON` | The JSON is malformed or wasn't URL-encoded |
| `it must have "v": 1` | Add `"v": 1` |
| `button 1 top needs 1 to 3 zones` | Add the missing half or remove extra zones |
| `button 1 top zone 1 has unknown field "x"` | Use only the fields in the table above |
| `button 1 top zone 1 has invalid iconColor` | Fix the value. Colors need six hex digits |
