import AstalBluetooth from "gi://AstalBluetooth"
import Gtk from "gi://Gtk?version=4.0"
import { createBinding, createComputed, createState, For, With } from "gnim"

export default function Bluetooth() {
  const bt = AstalBluetooth.get_default()
  const btOn = createBinding(bt, "isPowered")
  const devices = createBinding(bt, "devices")
  const [numConnected, setNumConnected] = createState(0)

  const updateConnected = () =>
    setNumConnected(devices().filter((d) => d.connected).length)
  updateConnected()

  const watchDevice = (device: AstalBluetooth.Device) =>
    device.connect("notify::connected", () => updateConnected())

  bt.connect("device-removed", (_, device) => watchDevice(device))
  bt.connect("device-added", (_, device) => watchDevice(device))

  bt.devices.forEach(watchDevice)

  return (
    <menubutton>
      <box>
        <With value={numConnected}>
          {(numConnected) => (
            <label label={numConnected > 0 ? `${numConnected} ` : ""} />
          )}
        </With>
        <With value={btOn}>
          {(btOn) => {
            const icon = btOn ? "bluetooth-symbolic" : "bluetooth-none-symbolic"

            return <image iconName={icon} />
          }}
        </With>
      </box>
      <popover>
        <box spacing={4} orientation={Gtk.Orientation.VERTICAL}>
          <For each={devices}>
            {(device) => {
              const connected = createBinding(device, "connected")
              const connStr = createComputed(() =>
                connected() ? "Connected" : "",
              )

              return (
                <box
                  valign={Gtk.Align.CENTER}
                  orientation={Gtk.Orientation.VERTICAL}
                >
                  <label xalign={0} label={connStr} />
                  <label xalign={0} label={createBinding(device, "name")} />
                </box>
              )
            }}
          </For>
        </box>
      </popover>
    </menubutton>
  )
}
