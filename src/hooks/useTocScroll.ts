import { useEffect } from "react"

export const useTocScroll = (offset: number = 80) => {
  useEffect(() => {
    const handleTocClick = (e: Event) => {
      // React Notion X의 목차 링크 선택
      const link = (e.target as Element)?.closest(
        ".notion-table_of_contents a, .notion-table-of-contents a"
      )
      if (!link) return

      const href = link.getAttribute("href")
      if (href && href.startsWith("#")) {
        e.preventDefault()

        // # 제거하고 ID만 추출
        const targetId = href.substring(1)

        // CSS.escape()로 안전한 선택자 만들기
        let targetElement: HTMLElement | null = null

        try {
          // 먼저 CSS.escape() 사용해서 시도
          const escapedId = CSS.escape(targetId)
          targetElement = document.querySelector(`#${escapedId}`) as HTMLElement
        } catch (error) {
          // CSS.escape() 실패하면 getElementById 사용
          targetElement = document.getElementById(targetId) as HTMLElement
        }

        // 둘 다 실패하면 data-id 속성으로 찾기
        if (!targetElement) {
          targetElement = document.querySelector(
            `[data-id="${targetId}"]`
          ) as HTMLElement
        }

        // 여전히 못 찾으면 notion 특정 선택자로 시도
        if (!targetElement) {
          targetElement = document.querySelector(
            `.notion-header[id="${targetId}"], .notion-block[id="${targetId}"]`
          ) as HTMLElement
        }

        if (targetElement) {
          // 제목의 실제 위치에서 offset만큼 위로 조정
          const elementTop =
            targetElement.getBoundingClientRect().top + window.pageYOffset
          const offsetTop = elementTop - offset

          window.scrollTo({
            top: Math.max(0, offsetTop),
            behavior: "smooth",
          })
        } else {
          console.warn(`Target element not found for ID: ${targetId}`)
        }
      }
    }

    // 이벤트 위임 사용 (성능 최적화)
    document.addEventListener("click", handleTocClick)

    return () => {
      document.removeEventListener("click", handleTocClick)
    }
  }, [offset])
}
