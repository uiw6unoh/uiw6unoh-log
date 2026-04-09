# **[notion-client@6] 업그레이드 후 발생 이슈**

![notion-client](https://prod-files-secure.s3.us-west-2.amazonaws.com/fcff9445-3d0f-44ff-99ce-0ec1558fa7c2/c0d0cffa-a926-48b3-8b35-a8e33e27c530/Untitled.png)

이 블로그는 [morethan-log](https://github.com/morethanmin/morethan-log) 오픈소스를 기반으로 Notion을 CMS로 사용하는 정적 블로그다. 내부적으로 [notion-client](https://github.com/NotionX/react-notion-x/tree/master/packages/notion-client) 라이브러리를 사용해 Notion API를 호출한다.

어느 날 notion-client를 최신 버전(@6.16.0)으로 업그레이드했더니 포스트 목록이 아예 불러와지지 않고, 세부 페이지에서는 런타임 에러가 쏟아지기 시작했다. 원인을 파헤쳐 보니 **레코드 응답 구조가 크게 바뀌어 있었다.**

---

## 📌 notion-client@6의 변경점: 레코드 이중 래핑

notion-client@5 이하에서는 블록 레코드가 이런 구조로 반환됐다.

```json
{
  "value": { "id": "...", "type": "page", "properties": { ... } },
  "role": "reader"
}
```

그런데 notion-client@6부터는 **한 겹이 더 감싸진다.**

```json
{
  "spaceId": "...",
  "value": {
    "value": { "id": "...", "type": "page", "properties": { ... } },
    "role": "reader"
  }
}
```

`block[id].value`로 접근하면 실제 데이터가 아니라 `{ value: {...}, role: "reader" }` 객체가 나온다. 이걸 인지하지 못하면 `type`, `properties` 등 모든 필드 접근이 실패하게 된다.

이 하나의 구조 변경이 여러 곳에서 연쇄적으로 문제를 일으켰다.

---

## ⚠️ 발생한 문제들

### 1. 포스트 목록이 아예 불러와지지 않음

**증상**

메인 페이지 접속 시 포스트가 하나도 표시되지 않는다.

**원인**

`getPage()` 내부에서 컬렉션 뷰 블록을 찾을 때 `block[id].value.type`을 체크한다. 그런데 이중 래핑 이후 `block[id].value`는 `{ value: actualData, role: ... }` 이므로 `type`이 `undefined`가 된다.

```js
// notion-client@6 내부 (index.js)
let i = t.block[c].value   // { value: {...}, role: '...' }
let g = i && (i.type === "collection_view" || ...) && Q(i, t)
// i.type === undefined → getCollectionData 호출 안 됨
```

결국 `response.collection_query`가 빈 객체(`{}`)로 남고, 포스트 ID 목록을 가져오지 못한다.

**해결**

`collection_query`가 비어있을 경우, `unwrapRecordValue`로 블록을 직접 unwrap해 컬렉션 ID와 뷰 ID를 추출한 뒤 `api.getCollectionData()`를 수동으로 호출해 채워준다.

```ts
// src/apis/notion-client/getPosts.ts

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
        const collectionView = unwrapRecordValue(
          response.collection_view[viewId]
        )
        const collectionData = await api.getCollectionData(
          collectionId,
          viewId,
          collectionView
        )
        if (!response.collection_query[collectionId]) {
          response.collection_query[collectionId] = {}
        }
        response.collection_query[collectionId][viewId] = (
          collectionData as any
        )?.result?.reducerResults
      } catch (e) {
        console.warn("Failed to fetch collection data for view", viewId, e)
      }
    }
  }
}
```

---

### 2. 세부 페이지에서 런타임 에러 발생

**증상**

```
TypeError: Cannot read properties of undefined (reading 'replace')
```

세부 페이지 접속 시 react-notion-x 렌더러가 올바르게 동작하지 않는다.

**원인**

`getRecordMap()`이 반환하는 recordMap의 블록들이 이중 래핑된 상태 그대로 react-notion-x에 전달된다. react-notion-x는 `block[id].value.type`, `block[id].value.properties` 등으로 블록 데이터에 접근하는데, 이중 래핑 상태에서는 `value`가 실제 데이터가 아니므로 `type`이 `undefined`가 되어 렌더링이 전부 실패한다.

**해결**

`getRecordMap()`에서 recordMap을 반환하기 전, 모든 테이블의 레코드를 react-notion-x가 기대하는 구조로 정규화한다.

```ts
// src/apis/notion-client/getRecordMap.ts

function normalizeRecordMap(recordMap: any) {
  const tables = [
    "block",
    "collection",
    "collection_view",
    "notion_user",
  ] as const
  for (const table of tables) {
    if (!recordMap[table]) continue
    for (const id in recordMap[table]) {
      const record = recordMap[table][id]
      if (record?.value?.value !== undefined) {
        recordMap[table][id] = {
          role: record.value.role,
          value: record.value.value,
        }
      }
    }
  }
}
```

| 정규화 전                                   | 정규화 후                            |
| ------------------------------------------- | ------------------------------------ |
| `{ spaceId, value: { value: data, role } }` | `{ value: data, role }`              |
| `block[id].value.type` → `undefined`        | `block[id].value.type` → `"page"` ✅ |

---

### 3. 블록이 많은 페이지의 내용이 일부 누락됨

**증상**

포스트 세부 페이지에서 특정 위치 이후의 내용이 잘려서 보이지 않는다.

**원인**

notion-client 내부는 누락된 블록을 찾기 위해 `getPageContentBlockIds()`를 호출한다. 이 함수는 `block[id].value.content`를 재귀 순회하며 자식 블록 ID를 수집하는데, 이중 래핑 상태에서는 `value.content`가 `undefined`라 탐색이 즉시 종료된다.

```js
// notion-utils getPageContentBlockIds 내부
let a = e.block[r]?.value         // { value: actualData, role } (이중 래핑)
let { content: m, ... } = a       // content === undefined
// 자식 블록 순회 안 됨 → 누락 블록 0개로 오판 → 추가 fetch 안 함
```

결과적으로 `loadPageChunk`로 받은 첫 청크(기본 100개) 이후의 블록이 누락된 줄 모르고 그냥 넘어가게 된다.

**해결**

`normalizeRecordMap()` 이후, 정규화된 상태에서 `getPageContentBlockIds()`를 직접 호출해 누락 블록을 찾고 반복 fetch한다.

```ts
// src/apis/notion-client/getRecordMap.ts

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
```

---

### 4. 기타 에러들

**mapPageUrl — `undefined` id**

react-notion-x가 일부 블록(링크드 데이터베이스, 미완성 블록)에 대해 `mapPageUrl`을 `undefined`로 호출하는 경우가 있다. null guard로 처리.

```ts
const mapPageUrl = (id: string) => {
  if (!id) return "https://www.notion.so/"
  return "https://www.notion.so/" + id.replace(/-/g, "")
}
```

**mermaid v9 — insertAdjacentHTML**

```
NoModificationAllowedError: Failed to execute 'insertAdjacentHTML' on 'Element': The element has no parent.
```

mermaid v9의 `render()`는 내부적으로 container에 `insertAdjacentHTML`을 호출한다. container를 렌더링 직전에 생성하고 body에 붙인 뒤 cleanup 시점에 제거하는 방식으로 해결.

```ts
const container = document.createElement("div")
container.style.visibility = "hidden"
document.body.appendChild(container)

// ... mermaid.render(..., container)

return () => {
  mounted = false
  cancel()
  container.remove() // cleanup 시점에 제거
}
```

---

## 💡 핵심 정리

<aside>
notion-client@6부터 모든 레코드는 { value: { value: data, role } } 형태로 이중 래핑된다.
block[id].value는 실제 데이터가 아니다. 반드시 한 겹 더 벗겨야 한다.
</aside>

이 구조 변경 하나가 포스트 목록 조회, 세부 페이지 렌더링, 블록 누락까지 연쇄적으로 영향을 미쳤다. 라이브러리 내부 코드조차 자신이 반환한 구조를 제대로 처리하지 못하는 상황이라, 외부에서 정규화 후 필요한 작업을 직접 수행하는 방식으로 해결했다.

---

## 참고

- [notion-client GitHub](https://github.com/NotionX/react-notion-x/tree/master/packages/notion-client)
- [react-notion-x GitHub](https://github.com/NotionX/react-notion-x)
- [morethan-log GitHub](https://github.com/morethanmin/morethan-log)
