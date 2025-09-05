export function generateId(prefix = "") {
  const rand = crypto.getRandomValues(new Uint32Array(2))
  return `${prefix}${rand[0].toString(36)}${rand[1].toString(36)}`
}

export function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}
