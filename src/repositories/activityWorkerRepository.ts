import { getDb } from '#core/database/mongo'

interface ActivityWorkerState {
  _id: 'activeMember'
  lastProcessedDay: string
}

function stateCollection() {
  return getDb().collection<ActivityWorkerState>('activityWorkerState')
}

export async function getLastProcessedActivityDay(): Promise<string | null> {
  const state = await stateCollection().findOne({ _id: 'activeMember' })
  return state?.lastProcessedDay ?? null
}

export async function setLastProcessedActivityDay(day: string): Promise<void> {
  await stateCollection().updateOne({ _id: 'activeMember' }, { $max: { lastProcessedDay: day } }, { upsert: true })
}
