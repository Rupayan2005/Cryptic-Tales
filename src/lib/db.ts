import { MongoClient, type Db } from "mongodb"

let client: MongoClient | null = null
let _db: Db | null = null

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB || "cryptic_tales"

if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable")
}

export async function getDb() {
  if (_db) return _db
  if (!client) client = new MongoClient(uri!)
  await client.connect()
  _db = client.db(dbName)
  return _db
}
