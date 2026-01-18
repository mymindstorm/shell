import AstalMpris from "gi://AstalMpris"
import { createBinding, createState, For, With } from "gnim"

const PAUSE_ICON = ""
const PLAY_ICON = ""

export default function Media() {
  const mpris = AstalMpris.get_default()
  const [title, setTitle] = createState("")

  mpris.connect("player-added", (_, player) => {
    player.connect("notify", (player) => {
      if (player.playbackStatus === AstalMpris.PlaybackStatus.STOPPED) {
        setTitle("")
        return
      }

      const icon =
        player.playbackStatus === AstalMpris.PlaybackStatus.PLAYING
          ? PLAY_ICON
          : PAUSE_ICON

      setTitle(`${icon} ${player.title}`)
    })
  })

  mpris.connect("player-closed", (_, player) => {
    if (title() === player.title) {
      setTitle("")
    }
  })

  return (
    <box>
      <With value={title}>
        {(title) =>
          title && (
            <menubutton>
              <label label={title} />
            </menubutton>
          )
        }
      </With>
    </box>
  )
}
