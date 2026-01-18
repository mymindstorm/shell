import { Accessor, createState, Setter, With } from "gnim"
import { NiriFocusedWindowResponse } from "../types/niri"
import NiriEvents from "../utils/NiriEvents"
import NiriSocket from "../utils/NiriSocket"

export default function CurrentWindow() {
  const [windowData, setWindowData] =
    createState<NiriFocusedWindowResponse | null>(null)

  const updateWindowData = async () => {
    try {
      setWindowData(await NiriSocket.getFocusedWindow())
    } catch (e) {
      console.error(`Could not get focused window! ${e}`)
    }
  }
  updateWindowData()

  NiriEvents.connect("event", async (_, payload: string) => {
    const event = JSON.parse(payload)
    if ("WindowFocusChanged" in event && "id" in event.WindowFocusChanged) {
      if (typeof event.WindowFocusChanged.id === "number") {
        try {
          await updateWindowData()
        } catch (e) {
          console.error(`currentwindow err: ${e}`)
        }
      } else {
        setWindowData(null)
      }
    }
  })

  return (
    <box>
      <With value={windowData}>
        {(windowData) =>
          windowData &&
          windowData.Ok.FocusedWindow && (
            <menubutton>
              <label label={windowData.Ok.FocusedWindow.title} />
            </menubutton>
          )
        }
      </With>
    </box>
  )
}
