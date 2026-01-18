import Gio from "gi://Gio?version=2.0"
import GLib from "gi://GLib?version=2.0"
import { NiriFocusedWindowResponse } from "../types/niri"

// Promisify required methods
Gio._promisify(Gio.SocketClient.prototype, "connect_async", "connect_finish")
Gio._promisify(
  Gio.InputStream.prototype,
  "read_bytes_async",
  "read_bytes_finish",
)

class NiriSocket {
  #connection: Gio.SocketConnection | null = null
  #output: Gio.DataOutputStream | null = null
  #input: Gio.DataInputStream | null = null
  #decoder = new TextDecoder()

  constructor() {
    // We trigger the connection immediately, but we don't await it here
    // because constructors cannot be async.
    this.#ensureConnection().catch(console.error)
  }

  /**
   * Ensures we have a valid, active connection.
   * Reconnects if the previous connection was closed or failed.
   */
  async #ensureConnection() {
    // If we already have a connection and it's not closed, return it.
    if (this.#connection && !this.#connection.is_closed()) {
      return
    }

    const socketPath = GLib.getenv("NIRI_SOCKET")
    if (!socketPath) throw new Error("NIRI_SOCKET not set")

    const client = new Gio.SocketClient()
    const address = new Gio.UnixSocketAddress({ path: socketPath })

    try {
      this.#connection = await client.connect_async(address, null)
    } catch (e) {
      console.log(`Error ensuring connection: ${e}`)
      return
    }

    if (!this.#connection) {
      throw new Error("Failed to establish connection to Niri")
    }

    this.#output = new Gio.DataOutputStream({
      base_stream: this.#connection.get_output_stream(),
    })

    this.#input = new Gio.DataInputStream({
      base_stream: this.#connection.get_input_stream(),
    })
  }

  /**
   * Sends a request using the persistent connection.
   */
  async send(request: any): Promise<any> {
    try {
      // 1. Make sure we are connected
      await this.#ensureConnection()

      if (!this.#output || !this.#input)
        throw new Error("Socket not initialized")

      // 2. Send Request
      const jsonString = JSON.stringify(request) + "\n"

      this.#output.put_string(jsonString, null)
      this.#output.flush(null)

      // 3. Read Response
      const responseBytes = this.#input.read_line(null)[0]
      if (responseBytes == null) {
        throw new Error("No response from niri!")
      }

      const decoder = new TextDecoder("utf-8") // Specify the correct encoding
      const contentsString = decoder.decode(responseBytes)

      return JSON.parse(contentsString)
    } catch (e) {
      console.warn("Socket error:", e)
    }
  }

  // --- Actions ---

  async getFocusedWindow(): Promise<NiriFocusedWindowResponse> {
    return await this.send("FocusedWindow")
  }
}

export default new NiriSocket()
