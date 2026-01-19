import { Astal, Gdk } from "ags/gtk4"
import { onCleanup } from "ags"
import CurrentWindow from "./CurrentWindow"
import Media from "./Media"
import Clock from "./Clock"
import Bluetooth from "./Bluetooth"
import Network from "./Network"
import Battery from "./Battery"

export default function Bar({ gdkmonitor }: { gdkmonitor: Gdk.Monitor }) {
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

  return (
    <window
      visible
      anchor={TOP | LEFT | RIGHT}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      $={(self) => onCleanup(() => self.destroy())}
      gdkmonitor={gdkmonitor}
      name={`bar-${gdkmonitor.connector}`}
      class="Bar"
    >
      <centerbox>
        <box $type="start">
          <CurrentWindow />
        </box>
        <box $type="end">
          <Media />
          <Network />
          <Bluetooth />
          <Battery />
          <Clock />
        </box>
      </centerbox>
    </window>
  )
}
