import { NotionAPI } from "notion-client"

function normalizeRecordMap(recordMap: any) {
  const tables = ["block", "collection", "collection_view", "notion_user"] as const
  for (const table of tables) {
    if (!recordMap[table]) continue
    for (const id in recordMap[table]) {
      const record = recordMap[table][id]
      if (record?.value?.value !== undefined) {
        recordMap[table][id] = { role: record.value.role, value: record.value.value }
      }
    }
  }
  return recordMap
}

export const getRecordMap = async (pageId: string) => {
  const api = new NotionAPI()
  const recordMap = await api.getPage(pageId)
  return normalizeRecordMap(recordMap)
}
