# notion-client@6 호환성 이슈 정리

---

## 1. 레코드 이중 래핑 문제 (record double-wrapping)

### 오류 원인

notion-client@5 이하에서는 레코드가 다음 구조로 반환되었다.

```json
{
  "value": { "id": "...", "type": "page", ... },
  "role": "reader"
}
```

notion-client@6부터는 레코드가 **이중 래핑**되어 반환된다.

```json
{
  "spaceId": "...",
  "value": {
    "value": { "id": "...", "type": "page", ... },
    "role": "reader"
  }
}
```

`block[id].value`로 접근하면 실제 데이터가 아닌 `{ value: {...}, role: "reader" }` 객체가 반환되어, `type`, `properties` 등 모든 필드 접근이 실패한다.

### 오류 해소

`src/libs/utils/notion/unwrapRecord.ts`에 유틸 함수를 작성하여 이중 래핑을 처리한다.

```ts
export function unwrapRecordValue<T = any>(record: any): T | undefined {
  if (record?.value?.value !== undefined) return record.value.value as T
  return record?.value as T | undefined
}
```

레코드에 접근하는 모든 곳에서 `unwrapRecordValue(block[id])` 형태로 사용한다.

---

## 2. collection_query 미수집 문제

### 오류 원인

notion-client@6의 `getPage()` 내부 코드는 컬렉션 뷰 블록을 찾을 때 `block[id].value.type`을 체크한다.

그러나 이중 래핑 이후 `block[id].value`는 `{ value: actualData, role: ... }` 이므로 `type`이 `undefined`가 되어, 라이브러리 내부에서 컬렉션 블록을 인식하지 못하고 `getCollectionData` 호출이 누락된다.

결과적으로 `response.collection_query`가 빈 객체(`{}`)로 남아 포스트 목록이 전혀 불러와지지 않는다.

```
// notion-client@6 내부 코드 (index.js)
let i = t.block[c].value  // ← 이중 래핑으로 인해 { value: {...}, role: '...' } 반환
let g = i && (i.type === "collection_view" || ...) && Q(i, t)
// i.type === undefined → g === false → getCollectionData 호출 안 됨
```

### 오류 해소

`getPosts.ts`에서 `collection_query`가 비어있을 경우, `unwrapRecordValue`로 블록을 직접 unwrap하여 컬렉션 ID와 뷰 ID를 추출한 뒤 `api.getCollectionData()`를 직접 호출해 수동으로 채운다.

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
```

---

## 3. mapPageUrl undefined 에러

### 오류 원인

react-notion-x의 `NotionRenderer`에 `mapPageUrl` prop을 전달할 때, 일부 블록(링크드 데이터베이스, 미완성 블록 등)은 유효한 ID 없이 `undefined`를 전달할 수 있다.

```
TypeError: Cannot read properties of undefined (reading 'replace')
```

### 오류 해소

`mapPageUrl`에 null guard 추가.

```ts
const mapPageUrl = (id: string) => {
  if (!id) return "https://www.notion.so/"
  return "https://www.notion.so/" + id.replace(/-/g, "")
}
```

---

## 4. mermaid v9 insertAdjacentHTML 에러

### 오류 원인

mermaid v9의 `mermaid.render()`는 SVG를 렌더링하기 위해 내부적으로 임시 DOM 요소를 생성하고 `insertAdjacentHTML`로 문서에 삽입한다. 4번째 인자인 `container`를 지정하지 않으면 `document.body`에 직접 삽입을 시도하는데, 타이밍 또는 DOM 상태에 따라 부모 없는 요소에 접근해 에러가 발생한다.

```
NoModificationAllowedError: Failed to execute 'insertAdjacentHTML' on 'Element':
The element has no parent.
```

### 오류 해소

`mermaid.render()` 호출 시 명시적으로 `container` 요소를 전달하고, 각 렌더링을 `try-catch`로 감싼다.

```ts
const container = document.createElement("div")
container.style.visibility = "hidden"
document.body.appendChild(container)

for (let i = 0; i < elements.length; i++) {
  try {
    mermaid.render(
      "mermaid" + i,
      elements[i].textContent || "",
      (svgCode: string) => { ... },
      container  // ← 명시적 container 전달
    )
  } catch (e) {
    console.warn("mermaid render error", e)
  }
}

document.body.removeChild(container)
```
