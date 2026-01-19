import AstalNetwork from "gi://AstalNetwork"
import Gtk from "gi://Gtk?version=4.0"
import { createBinding, createComputed, createState, For, With } from "gnim"

export default function Network() {
  const network = AstalNetwork.get_default()
  const connectionType = createBinding(network, "primary")
  const connectionState = createBinding(network, "state")
  const wifiStrength = createBinding(network.wifi, "strength")
  const wifiName = createBinding(network.wifi, "ssid")

  const wifiIcon = createBinding(network.wifi, "iconName")
  const wiredIcon = createBinding(network.wired, "iconName")
  const connectionIcon = createComputed(() => {
    const type = connectionType()
    // const state = connectionState()
    // const strength = wifiStrength()

    let icon = ""

    if (type === AstalNetwork.Primary.WIFI) {
      icon = wifiIcon()
    } else if (type === AstalNetwork.Primary.WIRED) {
      icon = wiredIcon()
    } else {
      icon = "network-wired-no-route-symbolic"
    }

    // if (type === AstalNetwork.Primary.WIFI) {
    //   if (state === AstalNetwork.State.CONNECTED_GLOBAL) {
    //     console.log("wifi strength: " + strength)
    //     icon = "network-wireless-signal-excellent-symbolic"
    //   } else if (
    //     state === AstalNetwork.State.CONNECTED_LOCAL ||
    //     state === AstalNetwork.State.CONNECTED_SITE ||
    //     state === AstalNetwork.State.UNKNOWN
    //   ) {
    //     icon = "network-wireless-no-route-symbolic"
    //   } else if (
    //     state === AstalNetwork.State.CONNECTING ||
    //     state === AstalNetwork.State.DISCONNECTING
    //   ) {
    //     icon = "network-wireless-acquiring-symbolic"
    //   } else if (state === AstalNetwork.State.DISCONNECTED) {
    //     icon = "network-wireless-offline-symbolic"
    //   }
    // } else if (type === AstalNetwork.Primary.WIRED) {
    //   if (state === AstalNetwork.State.CONNECTED_GLOBAL) {
    //     icon = "network-wired-symbolic"
    //   } else if (
    //     state === AstalNetwork.State.CONNECTED_LOCAL ||
    //     state === AstalNetwork.State.CONNECTED_SITE ||
    //     state === AstalNetwork.State.UNKNOWN
    //   ) {
    //     icon = "network-wired-no-route-symbolic"
    //   } else if (
    //     state === AstalNetwork.State.CONNECTING ||
    //     state === AstalNetwork.State.DISCONNECTING
    //   ) {
    //     icon = "network-wired-acquiring-symbolic"
    //   } else if (state === AstalNetwork.State.DISCONNECTED) {
    //     icon = "network-wired-disconnected-symbolic"
    //   }
    // } else {
    //   icon = "network-wired-no-route-symbolic"
    // }

    return icon
  })

  return (
    <menubutton>
      <box>
        <image iconName={connectionIcon} />
        <label
          label={wifiName((ssid) => {
            if (ssid) {
              return `  ${ssid}`
            } else {
              return ""
            }
          })}
        />
      </box>
      <popover></popover>
    </menubutton>
  )
}
