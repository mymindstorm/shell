import AstalBattery from "gi://AstalBattery"
import { createBinding, createComputed, With } from "gnim"
import dayjs from "dayjs/esm/index.js"
import relativeTime from "dayjs/plugin/relativeTime.js"

// @ts-ignore
dayjs.extend(relativeTime)

export default function Battery() {
  const battery = AstalBattery.get_default()

  const percent = createBinding(battery, "percentage")
  const labelText = createComputed(() => `  ${Math.round(percent() * 100)}%`)

  const icon = createBinding(battery, "batteryIconName")

  const timeToEmpty = createBinding(battery, "timeToEmpty")
  const timeToFull = createBinding(battery, "timeToFull")
  const state = createBinding(battery, "state")
  const tooltip = createComputed(() => {
    const now = dayjs()
    if (state() === AstalBattery.State.CHARGING) {
      const endTime = now.add(timeToFull(), "seconds")
      // @ts-ignore
      return `Charged ${now.to(endTime)}`
    } else if (state() === AstalBattery.State.DISCHARGING) {
      const endTime = now.add(timeToEmpty(), "seconds")
      // @ts-ignore
      return `Empty ${now.to(endTime)}`
    } else {
      return ""
    }
  })

  return (
    <menubutton tooltipText={tooltip}>
      <box>
        <image iconName={icon} />
        <label label={labelText} />
      </box>
    </menubutton>
  )
}
