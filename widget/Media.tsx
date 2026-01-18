import AstalMpris from "gi://AstalMpris"
import { createBinding, For } from "gnim"

export default function Media() {
  const mpris = AstalMpris.get_default()
  const players = createBinding(mpris, "players")

  return (
    <menubutton>
      <For each={players}>
        {(player) => {
          return <label label={`${player.title} by ${player.artist}. `} />
        }}
      </For>
    </menubutton>
  )
}
