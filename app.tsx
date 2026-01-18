import app from "ags/gtk4/app"
import { For, This, createBinding } from "ags"
import style from "./style.scss"
import Bar from "./widget/Bar"

app.start({
  css: style,
  main() {
    const monitors = createBinding(app, "monitors")

    return (
      <For each={monitors}>{(monitor) => <Bar gdkmonitor={monitor} />}</For>
    )
  },
})
