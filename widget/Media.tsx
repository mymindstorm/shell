import AstalMpris from "gi://AstalMpris"
import { createBinding, createComputed, createState, For, With } from "gnim"

const PAUSE_ICON = ""
const PLAY_ICON = ""

export default function Media() {
  const mpris = AstalMpris.get_default()
  const [title, setTitle] = createState("")
  const players = createBinding(mpris, "players")
  // For now, we just assume that the first one is the one we want to control
  // For some reason, firefox doesn't let multiple exist. Just the primary one.
  const firstPlayer = createComputed(() =>
    players().length > 0 ? players()[0] : null,
  )

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

      setTitle(`${icon} ${player.title}`.trim())
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
            <button onClicked={() => firstPlayer()?.play_pause()}>
              <label label={title} />
            </button>
          )
        }
      </With>
    </box>
  )
}
