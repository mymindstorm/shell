import GObject from "gi://GObject?version=2.0"
import Gio from "gi://Gio?version=2.0"
import GLib from "gi://GLib?version=2.0"

// 1. Define the class logic first
class NiriEventsService extends GObject.Object {
  // Private field
  #proc: Gio.Subprocess | null = null

  constructor() {
    super()
    this.#startEventStream()
  }

  #startEventStream() {
    try {
      // Spawn: niri msg --json event-stream
      this.#proc = new Gio.Subprocess({
        argv: ["niri", "msg", "--json", "event-stream"],
        flags: Gio.SubprocessFlags.STDOUT_PIPE,
      })
      this.#proc.init(null)

      const pipe = this.#proc.get_stdout_pipe()
      if (!pipe) throw new Error("No stdout pipe")

      const stream = new Gio.DataInputStream({
        base_stream: pipe,
        close_base_stream: true,
      })

      this.#readLoop(stream)
    } catch (e) {
      console.error("NiriService: Failed to start stream", e)
    }
  }

  #readLoop(stream: Gio.DataInputStream) {
    stream.read_line_async(0, null, (stream, res) => {
      try {
        if (!stream) return
        const [line] = stream.read_line_finish(res)

        if (line) {
          const text = new TextDecoder().decode(line)
          // Emit the signal (defined below in registerClass)
          this.emit("event", text)

          this.#readLoop(stream)
        }
      } catch (e) {
        console.error("NiriService: Error reading stream", e)
      }
    })
  }
}

// 2. Register the class using the Functional Pattern.
// This is safer than decorators because it guarantees the class exists
// before passing it to GObject.
const NiriEvents = GObject.registerClass(
  {
    GTypeName: "NiriService",
    Signals: {
      event: {
        param_types: [GObject.TYPE_STRING],
        flags: GObject.SignalFlags.RUN_FIRST,
      },
    },
  },
  NiriEventsService,
)

// 3. Export the Singleton instance
export default new NiriEvents()
