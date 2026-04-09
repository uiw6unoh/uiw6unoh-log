import { CONFIG } from "site.config"
import { NotionAPI } from "notion-client"
import { idToUuid } from "notion-utils"

import getAllPageIds from "src/libs/utils/notion/getAllPageIds"
import getPageProperties from "src/libs/utils/notion/getPageProperties"
import { unwrapRecordValue } from "src/libs/utils/notion/unwrapRecord"
import { TPosts } from "src/types"

/**
 * @param {{ includePages: boolean }} - false: posts only / true: include pages
 */

// TODO: react query를 사용해서 처음 불러온 뒤로는 해당데이터만 사용하도록 수정
export const getPosts = async () => {
  let id = CONFIG.notionConfig.pageId as string
  const api = new NotionAPI()

  const response = await api.getPage(id)
  id = idToUuid(id)

  if (Object.keys(response.collection_query).length === 0) {
    const rawMetadataForQuery = unwrapRecordValue(response.block[id])
    if (
      rawMetadataForQuery?.type === "collection_view_page" ||
      rawMetadataForQuery?.type === "collection_view"
    ) {
      const collectionId = Object.keys(response.collection)[0]
      const viewIds: string[] = rawMetadataForQuery?.view_ids || []
      for (const viewId of viewIds) {
        try {
          const collectionView = unwrapRecordValue(response.collection_view[viewId])
          const collectionData = await api.getCollectionData(
            collectionId,
            viewId,
            collectionView
          )
          if (!response.collection_query[collectionId]) {
            response.collection_query[collectionId] = {}
          }
          response.collection_query[collectionId][viewId] =
            (collectionData as any)?.result?.reducerResults
        } catch (e) {
          console.warn("Failed to fetch collection data for view", viewId, e)
        }
      }
    }
  }

  const collection = unwrapRecordValue(Object.values(response.collection)[0])
  const block = response.block
  const schema = collection?.schema

  const rawMetadata = unwrapRecordValue(block[id])

  // Check Type
  if (
    rawMetadata?.type !== "collection_view_page" &&
    rawMetadata?.type !== "collection_view"
  ) {
    return []
  } else {
    // Construct Data
    const pageIds = getAllPageIds(response)
    const wholeBlocks = await (await api.getBlocks(pageIds)).recordMap.block

    const data = []
    for (let i = 0; i < pageIds.length; i++) {
      const id = pageIds[i]
      const properties =
        (await getPageProperties(id, wholeBlocks, schema)) || null
      const blockData = unwrapRecordValue(wholeBlocks[id])
      if (!blockData) continue

      // Add fullwidth, createdtime to properties
      properties.createdTime = new Date(
        blockData?.created_time
      ).toString()
      properties.fullWidth =
        (blockData?.format as any)?.page_full_width ?? false

      data.push(properties)
    }

    // Sort by date
    data.sort((a: any, b: any) => {
      const dateA: any = new Date(a?.date?.start_date || a.createdTime)
      const dateB: any = new Date(b?.date?.start_date || b.createdTime)
      return dateB - dateA
    })

    const posts = data as TPosts
    return posts
  }
}
