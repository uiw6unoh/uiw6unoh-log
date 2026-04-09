import { NotionAPI } from "notion-client"
import { getPageContentBlockIds } from "notion-utils"

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
}

export const getRecordMap = async (pageId: string) => {
  const api = new NotionAPI()
  const recordMap = await api.getPage(pageId)

  normalizeRecordMap(recordMap)

  for (;;) {
    const allIds = getPageContentBlockIds(recordMap)
    const missingIds = allIds.filter((id) => !recordMap.block[id])
    if (!missingIds.length) break

    const fetched = (await api.getBlocks(missingIds)).recordMap.block
    for (const id in fetched) {
      const record = fetched[id] as any
      if (record?.value?.value !== undefined) {
        fetched[id] = { role: record.value.role, value: record.value.value }
      }
    }
    Object.assign(recordMap.block, fetched)
  }

  return recordMap
}
