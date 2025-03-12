import { CONFIG } from "site.config"
import { NotionAPI } from "notion-client"
import { idToUuid } from "notion-utils"

import getAllPageIds from "src/libs/utils/notion/getAllPageIds"
import getPageProperties from "src/libs/utils/notion/getPageProperties"
import { TPosts } from "src/types"

// TODO: 원하는 slug들을 이 배열에 추가하여 제외
const EXCLUDE_SLUGS = ["baekjoon-2743", "baekjoon-10798"]

/**
 * @param {{ includePages: boolean }} - false: posts only / true: include pages
 */
// TODO: react query를 사용해서 처음 불러온 뒤로는 해당데이터만 사용하도록 수정
export const getPosts = async () => {
  let id = CONFIG.notionConfig.pageId as string
  const api = new NotionAPI()

  const response = await api.getPage(id)
  id = idToUuid(id)
  const collection = Object.values(response.collection)[0]?.value
  const block = response.block
  const schema = collection?.schema

  const rawMetadata = block[id].value

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
      const pageId = pageIds[i]
      const properties = (await getPageProperties(pageId, wholeBlocks, schema)) || null
      if (!wholeBlocks[pageId]) continue

      // Add fullwidth, createdtime to properties
      properties.createdTime = new Date(
        wholeBlocks[pageId].value?.created_time
      ).toString()
      properties.fullWidth =
        (wholeBlocks[pageId].value?.format as any)?.page_full_width ?? false

      data.push(properties)
    }

    // Sort by date
    data.sort((a: any, b: any) => {
      const dateA: any = new Date(a?.date?.start_date || a.createdTime)
      const dateB: any = new Date(b?.date?.start_date || b.createdTime)
      return dateB - dateA
    })

    let posts = data as TPosts

    // 1) 슬러그 제외 로직: 특정 슬러그들은 빌드 대상에서 제외
    posts = posts.filter((post) => !EXCLUDE_SLUGS.includes(post.slug))

    return posts
  }
}
