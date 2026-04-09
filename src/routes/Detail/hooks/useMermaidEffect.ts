import mermaid from "mermaid"
import { useEffect } from "react"

const waitForMermaid = (interval = 100, timeout = 5000) => {
  let timerId: ReturnType<typeof setTimeout>
  let cancelled = false

  const promise = new Promise<HTMLCollectionOf<Element>>((resolve, reject) => {
    const startTime = Date.now()
    const elements = document.getElementsByClassName("language-mermaid")

    const check = () => {
      if (cancelled) return
      if (elements.length > 0) {
        resolve(elements)
      } else if (Date.now() - startTime >= timeout) {
        reject(new Error(`mermaid elements not found within the timeout period.`))
      } else {
        timerId = setTimeout(check, interval)
      }
    }
    check()
  })

  const cancel = () => {
    cancelled = true
    clearTimeout(timerId)
  }

  return { promise, cancel }
}

const useMermaidEffect = () => {
  useEffect(() => {
    mermaid.initialize({ startOnLoad: true })

    let mounted = true
    const { promise, cancel } = waitForMermaid()

    const container = document.createElement("div")
    container.style.visibility = "hidden"
    container.style.position = "absolute"
    document.body.appendChild(container)

    promise
      .then((elements) => {
        if (!mounted) return
        const parser = new DOMParser()

        for (let i = 0; i < elements.length; i++) {
          try {
            mermaid.render(
              "mermaid" + i,
              elements[i].textContent || "",
              (svgCode: string) => {
                if (!mounted) return
                const doc = parser.parseFromString(svgCode, "image/svg+xml")
                const svg = doc.documentElement
                if (svg instanceof SVGElement) {
                  elements[i].replaceChildren(svg)
                }
              },
              container
            )
          } catch (e) {
            console.warn("mermaid render error", e)
          }
        }
      })
      .catch((error) => {
        console.warn(error)
      })

    return () => {
      mounted = false
      cancel()
      container.remove()
    }
  }, [])
}

export default useMermaidEffect
