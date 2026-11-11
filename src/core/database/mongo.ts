import { MongoClient, type Db } from 'mongodb'

let mongoClient: MongoClient | undefined

export async function connectMongo(uri: string): Promise<void> {
  const client = new MongoClient(uri)

  try {
    await client.connect()
    await client.db().command({ ping: 1 })
    mongoClient = client
  } catch (err) {
    await client.close().catch(() => {})
    throw err
  }
}

export function getDb(): Db {
  if (!mongoClient) throw new Error('MongoDB is not connected')

  return mongoClient.db()
}

export async function closeMongo(): Promise<void> {
  await mongoClient?.close()
  mongoClient = undefined
}
