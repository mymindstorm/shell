import AstalNetwork from "gi://AstalNetwork"
import GLib from "gi://GLib"
import Gtk from "gi://Gtk?version=4.0"
import NM from "gi://NM"
import {
  Accessor,
  createBinding,
  createComputed,
  createState,
  For,
  With,
} from "gnim"

export default function Network() {
  const network = AstalNetwork.get_default()
  const connectionType = createBinding(network, "primary")
  const wifiState = createBinding(network.wifi, "state")
  const wifiName = createBinding(network.wifi, "ssid")
  const accessPoints = createBinding(network.wifi, "accessPoints")
  const scanning = createBinding(network.wifi, "scanning")

  const wifiIcon = createBinding(network.wifi, "iconName")
  const wiredIcon = createBinding(network.wired, "iconName")
  const connectionIcon = createComputed(() => {
    const type = connectionType()

    if (type === AstalNetwork.Primary.WIFI) {
      return wifiIcon()
    } else if (type === AstalNetwork.Primary.WIRED) {
      return wiredIcon()
    } else {
      return "network-wired-no-route-symbolic"
    }
  })

  const isWifiConnected = createComputed(() => {
    const state = wifiState()
    return state === AstalNetwork.DeviceState.ACTIVATED
  })

  const scanWifi = () => {
    network.wifi.scan()
  }

  // Filter out current network and empty SSIDs
  const availableNetworks = createComputed(() => {
    const currentSsid = wifiName()
    return accessPoints().filter((ap) => {
      const ssid = ap.ssid
      return ssid && ssid !== currentSsid
    })
  })

  // Scan on initial load
  scanWifi()

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
      <popover>
        <box
          orientation={Gtk.Orientation.VERTICAL}
          cssClasses={["network-popover"]}
          spacing={4}
        >
          {/* Header */}
          <box cssClasses={["network-header"]} spacing={8}>
            <image iconName="network-wireless-symbolic" pixelSize={20} />
            <label label="Wi-Fi" cssClasses={["heading"]} hexpand xalign={0} />
            <With value={scanning}>
              {(isScanning) =>
                isScanning ? (
                  <Gtk.Spinner spinning={true} />
                ) : (
                  <button
                    cssClasses={["flat", "circular"]}
                    tooltipText="Scan for networks"
                    onClicked={scanWifi}
                  >
                    <image iconName="view-refresh-symbolic" pixelSize={16} />
                  </button>
                )
              }
            </With>
          </box>

          {/* Current Connection */}
          <CurrentConnection
            wifiName={wifiName}
            wifiIcon={wifiIcon}
            isConnected={isWifiConnected}
          />

          {/* Available Networks */}
          <NetworkList networks={availableNetworks} scanWifi={scanWifi} />
        </box>
      </popover>
    </menubutton>
  )
}

function hasSavedConnection(ssid: string): boolean {
  const network = AstalNetwork.get_default()
  const connections = network.client.get_connections()

  for (const conn of connections) {
    const setting = conn.get_setting_wireless()
    if (setting) {
      const connSsid = setting.get_ssid()
      if (connSsid) {
        const ssidData = connSsid.get_data()
        if (ssidData) {
          const connSsidStr = new TextDecoder().decode(ssidData)
          if (connSsidStr === ssid) {
            return true
          }
        }
      }
    }
  }
  return false
}

function connectToAp(ap: AstalNetwork.AccessPoint, password?: string) {
  const network = AstalNetwork.get_default()

  if (password && ap.ssid) {
    // Create a new connection with the password
    const connection = NM.SimpleConnection.new()

    // Wireless settings
    const wirelessSetting = NM.SettingWireless.new()
    const ssidBytes = new TextEncoder().encode(ap.ssid)
    wirelessSetting.ssid = GLib.Bytes.new(ssidBytes)
    connection.add_setting(wirelessSetting)

    // Wireless security settings
    const securitySetting = NM.SettingWirelessSecurity.new()
    securitySetting.key_mgmt = "wpa-psk"
    securitySetting.psk = password
    connection.add_setting(securitySetting)

    // Connection settings
    const connectionSetting = NM.SettingConnection.new()
    connectionSetting.id = ap.ssid
    connectionSetting.type = "802-11-wireless"
    connectionSetting.uuid = NM.utils_uuid_generate()
    connection.add_setting(connectionSetting)

    // Add and activate the connection
    network.client.add_and_activate_connection_async(
      connection,
      network.wifi.device,
      ap.get_path(),
      null,
      null,
    )
  } else {
    // No password needed or using saved connection, just activate
    network.client.activate_connection_async(
      null,
      network.wifi.device,
      ap.get_path(),
      null,
      null,
    )
  }
}

function showPasswordDialog(ap: AstalNetwork.AccessPoint) {
  const window = new Gtk.Window({
    title: `Connect to ${ap.ssid}`,
    modal: false,
    resizable: false,
    decorated: true,
    defaultWidth: 350,
  })

  const content = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    spacing: 16,
    marginTop: 20,
    marginBottom: 20,
    marginStart: 20,
    marginEnd: 20,
  })

  // Header with icon
  const header = new Gtk.Box({
    orientation: Gtk.Orientation.HORIZONTAL,
    spacing: 12,
    halign: Gtk.Align.CENTER,
  })

  const icon = new Gtk.Image({
    iconName: "network-wireless-symbolic",
    pixelSize: 48,
  })
  header.append(icon)

  const titleLabel = new Gtk.Label({
    label: ap.ssid || "Unknown Network",
    cssClasses: ["title-2"],
  })
  header.append(titleLabel)

  content.append(header)

  // Password entry
  const label = new Gtk.Label({
    label: "Enter the Wi-Fi password",
    xalign: 0,
    cssClasses: ["dim-label"],
  })
  content.append(label)

  const passwordEntry = new Gtk.PasswordEntry({
    showPeekIcon: true,
    placeholderText: "Password",
    hexpand: true,
  })
  content.append(passwordEntry)

  // Buttons
  const buttonBox = new Gtk.Box({
    orientation: Gtk.Orientation.HORIZONTAL,
    spacing: 12,
    homogeneous: true,
    marginTop: 8,
  })

  const cancelButton = new Gtk.Button({
    label: "Cancel",
  })
  cancelButton.connect("clicked", () => {
    window.destroy()
  })
  buttonBox.append(cancelButton)

  const connectButton = new Gtk.Button({
    label: "Connect",
    cssClasses: ["suggested-action"],
  })
  connectButton.connect("clicked", () => {
    const password = passwordEntry.text
    if (password) {
      connectToAp(ap, password)
      window.destroy()
    }
  })
  buttonBox.append(connectButton)

  content.append(buttonBox)

  // Allow Enter key to submit
  passwordEntry.connect("activate", () => {
    const password = passwordEntry.text
    if (password) {
      connectToAp(ap, password)
      window.destroy()
    }
  })

  // Close on Escape key
  const keyController = new Gtk.EventControllerKey()
  keyController.connect("key-pressed", (_, keyval) => {
    if (keyval === 65307) {
      // Escape key
      window.destroy()
      return true
    }
    return false
  })
  window.add_controller(keyController)

  window.set_child(content)
  window.present()
}

function tryConnectToAp(ap: AstalNetwork.AccessPoint) {
  const isSecured = ap.flags !== 0 || ap.wpaFlags !== 0 || ap.rsnFlags !== 0

  if (isSecured && ap.ssid) {
    // Check if we have a saved connection for this network
    if (hasSavedConnection(ap.ssid)) {
      // Use saved connection
      connectToAp(ap)
    } else {
      // Need to prompt for password
      showPasswordDialog(ap)
    }
  } else {
    // Open network, just connect
    connectToAp(ap)
  }
}

function CurrentConnection({
  wifiName,
  wifiIcon,
  isConnected,
}: {
  wifiName: Accessor<string>
  wifiIcon: Accessor<string>
  isConnected: Accessor<boolean>
}) {
  const network = AstalNetwork.get_default()

  const statusLabel = createComputed(() =>
    isConnected() ? "Connected" : "Disconnected",
  )

  const statusClass = createComputed(() =>
    isConnected() ? "status-connected" : "status-disconnected",
  )

  const buttonLabel = createComputed(() =>
    isConnected() ? "Disconnect" : "Connect",
  )

  const displayName = createComputed(() => wifiName() || "No network")

  const hasNetwork = createComputed(() => !!wifiName())

  const handleClick = () => {
    if (isConnected()) {
      network.wifi.deactivate_connection(null)
    } else {
      // Find the access point matching the current SSID
      const ssid = wifiName()
      const ap = network.wifi.accessPoints.find((a) => a.ssid === ssid)

      if (ap) {
        tryConnectToAp(ap)
      }
    }
  }

  return (
    <box
      cssClasses={["current-network"]}
      spacing={12}
      valign={Gtk.Align.CENTER}
      visible={hasNetwork}
    >
      <image iconName={wifiIcon} pixelSize={24} cssClasses={["network-icon"]} />
      <box
        orientation={Gtk.Orientation.VERTICAL}
        hexpand
        valign={Gtk.Align.CENTER}
        spacing={2}
      >
        <label
          xalign={0}
          label={displayName}
          cssClasses={["network-name"]}
          ellipsize={3}
          maxWidthChars={20}
        />
        <With value={statusClass}>
          {(statusCls) => (
            <label
              xalign={0}
              label={statusLabel}
              cssClasses={["network-status", statusCls]}
            />
          )}
        </With>
      </box>
      <button
        cssClasses={["network-button"]}
        valign={Gtk.Align.CENTER}
        widthRequest={90}
        onClicked={handleClick}
      >
        <label label={buttonLabel} />
      </button>
    </box>
  )
}

function NetworkList({
  networks,
  scanWifi,
}: {
  networks: Accessor<AstalNetwork.AccessPoint[]>
  scanWifi: () => void
}) {
  return (
    <box orientation={Gtk.Orientation.VERTICAL} spacing={4}>
      <label
        xalign={0}
        label="Available Networks"
        cssClasses={["section-label"]}
      />
      <For each={networks}>{(ap) => <AccessPointRow ap={ap} />}</For>
      <EmptyNetworkState networks={networks} scanWifi={scanWifi} />
    </box>
  )
}

function AccessPointRow({ ap }: { ap: AstalNetwork.AccessPoint }) {
  const ssid = createBinding(ap, "ssid")
  const strength = createBinding(ap, "strength")
  const iconName = createBinding(ap, "iconName")
  const isSecured = createBinding(ap, "flags")

  const strengthLabel = createComputed(() => {
    const s = strength()
    if (s >= 80) return "Excellent"
    if (s >= 60) return "Good"
    if (s >= 40) return "Fair"
    return "Weak"
  })

  const handleConnect = () => {
    tryConnectToAp(ap)
  }

  return (
    <box cssClasses={["network-row"]} spacing={12} valign={Gtk.Align.CENTER}>
      <image iconName={iconName} pixelSize={24} cssClasses={["network-icon"]} />
      <box
        orientation={Gtk.Orientation.VERTICAL}
        hexpand
        valign={Gtk.Align.CENTER}
        spacing={2}
      >
        <box spacing={6}>
          <label
            xalign={0}
            label={ssid}
            cssClasses={["network-name"]}
            ellipsize={3}
            maxWidthChars={18}
          />
          <With value={isSecured}>
            {(flags) =>
              flags ? (
                <image
                  iconName="system-lock-screen-symbolic"
                  pixelSize={12}
                  cssClasses={["lock-icon"]}
                  tooltipText="Secured network"
                />
              ) : (
                <box />
              )
            }
          </With>
        </box>
        <label
          xalign={0}
          label={strengthLabel}
          cssClasses={["network-status", "status-disconnected"]}
        />
      </box>
      <button
        cssClasses={["network-button"]}
        valign={Gtk.Align.CENTER}
        widthRequest={90}
        onClicked={handleConnect}
      >
        <label label="Connect" />
      </button>
    </box>
  )
}

function EmptyNetworkState({
  networks,
  scanWifi,
}: {
  networks: Accessor<AstalNetwork.AccessPoint[]>
  scanWifi: () => void
}) {
  return (
    <With value={networks}>
      {(aps) =>
        aps.length === 0 ? (
          <box
            cssClasses={["empty-state"]}
            orientation={Gtk.Orientation.VERTICAL}
            spacing={8}
            valign={Gtk.Align.CENTER}
            halign={Gtk.Align.CENTER}
          >
            <image
              iconName="network-wireless-offline-symbolic"
              pixelSize={48}
            />
            <label label="No networks found" cssClasses={["dim-label"]} />
            <button onClicked={scanWifi}>
              <label label="Scan Again" />
            </button>
          </box>
        ) : (
          <box />
        )
      }
    </With>
  )
}
