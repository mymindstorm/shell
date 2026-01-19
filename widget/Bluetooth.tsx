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
    device.connect("notify:: connected", () => updateConnected())

  bt.connect("device-removed", (_, device) => watchDevice(device))
  bt.connect("device-added", (_, device) => watchDevice(device))

  bt.devices.forEach(watchDevice)

  const toggleConnection = (device: AstalBluetooth.Device) => {
    if (device.connected) {
      device.disconnect_device(() => {})
    } else {
      device.connect_device(() => {})
    }
  }

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
        <box
          orientation={Gtk.Orientation.VERTICAL}
          cssClasses={["bluetooth-popover"]}
          spacing={4}
        >
          {/* Device List */}
          <For each={devices}>
            {(device) => {
              const connected = createBinding(device, "connected")
              const connecting = createBinding(device, "connecting")
              const icon = createBinding(device, "icon")
              const name = createBinding(device, "name")

              const statusLabel = createComputed(() => {
                if (connecting()) return "Connecting..."
                if (connected()) return "Connected"
                return "Disconnected"
              })

              const buttonLabel = createComputed(() => {
                if (connecting()) return "..."
                return connected() ? "Disconnect" : "Connect"
              })

              const statusClass = createComputed(() =>
                connected() ? "status-connected" : "status-disconnected",
              )

              return (
                <box
                  cssClasses={["device-row"]}
                  spacing={12}
                  valign={Gtk.Align.CENTER}
                >
                  {/* Device Icon */}
                  <With value={icon}>
                    {(iconName) => (
                      <image
                        iconName={iconName || "bluetooth-symbolic"}
                        pixelSize={24}
                        cssClasses={["device-icon"]}
                      />
                    )}
                  </With>

                  {/* Device Info */}
                  <box
                    orientation={Gtk.Orientation.VERTICAL}
                    hexpand
                    valign={Gtk.Align.CENTER}
                    spacing={2}
                  >
                    <label
                      xalign={0}
                      label={name}
                      cssClasses={["device-name"]}
                      ellipsize={3}
                      maxWidthChars={20}
                    />
                    <With value={statusClass}>
                      {(statusCls) => (
                        <label
                          xalign={0}
                          label={statusLabel}
                          cssClasses={["device-status", statusCls]}
                        />
                      )}
                    </With>
                  </box>

                  {/* Connect/Disconnect Button */}
                  <With value={connecting}>
                    {(isConnecting) => (
                      <button
                        cssClasses={["device-button"]}
                        sensitive={!isConnecting}
                        onClicked={() => toggleConnection(device)}
                        valign={Gtk.Align.CENTER}
                      >
                        <label label={buttonLabel} />
                      </button>
                    )}
                  </With>
                </box>
              )
            }}
          </For>

          {/* Empty State */}
          <With value={devices}>
            {(deviceList) =>
              deviceList.length === 0 ? (
                <box
                  cssClasses={["empty-state"]}
                  orientation={Gtk.Orientation.VERTICAL}
                  spacing={8}
                  valign={Gtk.Align.CENTER}
                  halign={Gtk.Align.CENTER}
                >
                  <image
                    iconName="bluetooth-disabled-symbolic"
                    pixelSize={48}
                  />
                  <label label="No devices found" cssClasses={["dim-label"]} />
                </box>
              ) : null
            }
          </With>
        </box>
      </popover>
    </menubutton>
  )
}
