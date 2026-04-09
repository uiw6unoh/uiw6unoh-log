import { getTextContent, getDateValue } from "notion-utils"
import { NotionAPI } from "notion-client"
import { BlockMap, CollectionPropertySchemaMap } from "notion-types"
import { customMapImageUrl } from "./customMapImageUrl"
import { unwrapRecordValue } from "./unwrapRecord"

async function getPageProperties(
  id: string,
  block: BlockMap,
  schema: CollectionPropertySchemaMap
) {
  const api = new NotionAPI()
  const blockData = unwrapRecordValue(block?.[id])
  const rawProperties = Object.entries(blockData?.properties || [])
  const properties: any = { id }
  for (const [key, val] of rawProperties as [string, any][]) {
    const schemaEntry = schema[key]
    if (!schemaEntry) continue

    switch (schemaEntry.type) {
      case "file": {
        const url: string | undefined = val?.[0]?.[1]?.[0]?.[1]
        properties[schemaEntry.name] = url
          ? customMapImageUrl(url, blockData)
          : undefined
        break
      }
      case "date": {
        const dateProperty: any = getDateValue(val)
        delete dateProperty.type
        properties[schemaEntry.name] = dateProperty
        break
      }
      case "select":
      case "multi_select": {
        const selects = getTextContent(val)
        if (selects[0]?.length) {
          properties[schemaEntry.name] = selects.split(",")
        }
        break
      }
      case "person": {
        const rawUsers = val.flat()
        const users = []
        for (const rawUser of rawUsers) {
          if (rawUser[0][1]) {
            const userId = rawUser[0]
            const res: any = await api.getUsers(userId)
            const resValue = unwrapRecordValue(
              res?.recordMapWithRoles?.notion_user?.[userId[1]]
            )
            users.push({
              id: resValue?.id,
              name:
                resValue?.name ||
                `${resValue?.family_name}${resValue?.given_name}` ||
                undefined,
              profile_photo: resValue?.profile_photo || null,
            })
          }
        }
        properties[schemaEntry.name] = users
        break
      }
      default: {
        properties[schemaEntry.name] = getTextContent(val)
        break
      }
    }
  }
  return properties
}

export { getPageProperties as default }
