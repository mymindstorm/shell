export interface NiriLayout {
  pos_in_scrolling_layout: [number, number]
  tile_size: [number, number]
  window_size: [number, number]
  tile_pos_in_workspace_view: [number, number] | null
  window_offset_in_tile: [number, number]
}

export interface NiriWindow {
  id: number
  title: string
  app_id: string
  pid: number
  workspace_id: number | null // Nullable because pinned/scratchpad windows might not have IDs
  is_focused: boolean
  is_floating: boolean
  is_urgent: boolean
  layout: NiriLayout
}

export interface NiriFocusedWindowResponse {
  Ok: {
    FocusedWindow: NiriWindow | null
  }
}
