import { createPoll } from "ags/time"
import GLib from "gi://GLib?version=2.0"
import Gtk from "gi://Gtk?version=4.0"

export default function Clock({
  timeFormat = "%l:%M %p",
  dateFormat = "%A, %B %e",
}) {
  const time = createPoll("", 250, () => {
    return GLib.DateTime.new_now_local().format(timeFormat)!.trim()
  })

  const date = createPoll("", 5000, () => {
    return GLib.DateTime.new_now_local().format(dateFormat)!.trim()
  })

  return (
    <menubutton tooltipText={date}>
      <label label={time}></label>
      <popover>
        <Gtk.Calendar />
      </popover>
    </menubutton>
  )
}
