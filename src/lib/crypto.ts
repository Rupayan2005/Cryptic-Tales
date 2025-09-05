import CryptoJS from "crypto-js"

export function generateRoomKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  let bin = ""
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin) // base64
}

export function encryptJsonWithKey(obj: unknown, base64Key: string) {
  const plaintext = JSON.stringify(obj)
  const key = CryptoJS.enc.Base64.parse(base64Key)
  const iv = CryptoJS.lib.WordArray.random(16)
  const cipher = CryptoJS.AES.encrypt(plaintext, key, { iv })
  return { iv: CryptoJS.enc.Base64.stringify(iv), ciphertext: cipher.toString() }
}

export function decryptJsonWithKey<T = unknown>(payload: { iv: string; ciphertext: string }, base64Key: string): T {
  const key = CryptoJS.enc.Base64.parse(base64Key)
  const iv = CryptoJS.enc.Base64.parse(payload.iv)
  const decrypted = CryptoJS.AES.decrypt(payload.ciphertext, key, { iv })
  const text = decrypted.toString(CryptoJS.enc.Utf8)
  return JSON.parse(text) as T
}
