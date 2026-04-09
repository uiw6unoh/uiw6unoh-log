import React, { useState, useEffect, useRef, ReactNode } from "react"
import { ThemeProvider } from "./ThemeProvider"
import useScheme from "src/hooks/useScheme"
import Header from "./Header"
import styled from "@emotion/styled"
import Scripts from "src/layouts/RootLayout/Scripts"
import useGtagEffect from "./useGtagEffect"
import { useRouter } from "next/router"

type Props = {
  children: ReactNode
}

const RootLayout = ({ children }: Props) => {
  const router = useRouter()
  const currentElementRef = useRef<HTMLDivElement | null>(null)

  const [blogHeight, setBlogHeight] = useState(0)
  const [throttleScrollY, setThrottleScrollY] = useState<number>(0)
  const [scheme] = useScheme()

  useGtagEffect()

  const getCurrentPercentage = () => {
    if (window.scrollY === 0 || router.asPath === "/") return 0

    if (!currentElementRef.current) return 0

    const scrollPosition = window.scrollY + window.innerHeight
    const totalHeight = document.documentElement.scrollHeight
    let percentage = (scrollPosition / totalHeight) * 100
    percentage = Math.min(100, Math.max(0, percentage))

    percentage = percentage >= 90 ? 100 : percentage
    return Math.ceil(percentage)
  }

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null

    const scrollThrottle = () => {
      if (!timer) {
        setThrottleScrollY(window.scrollY)
        timer = setTimeout(() => {
          timer = null
        }, 100)
      }
    }

    const updateBlogHeight = () => {
      const totalHeight = document.documentElement.scrollHeight
      setBlogHeight(window.scrollY === 0 ? 0 : totalHeight - window.innerHeight)
    }

    window.addEventListener("resize", updateBlogHeight)
    window.addEventListener("scroll", scrollThrottle)

    updateBlogHeight()

    return () => {
      window.removeEventListener("scroll", scrollThrottle)
      window.removeEventListener("resize", updateBlogHeight)
      if (timer) clearTimeout(timer)
    }
  }, [])

  return (
    <ThemeProvider scheme={scheme}>
      <Scripts />
      {/* // TODO: replace react query */}
      {/* {metaConfig.type !== "Paper" && <Header />} */}
      <Header
        fullWidth={false}
        readingProgress={blogHeight < 1200 ? 0 : getCurrentPercentage()}
      />
      <StyledMain ref={currentElementRef}>{children}</StyledMain>
    </ThemeProvider>
  )
}

export default RootLayout

const StyledMain = styled.main`
  margin: 0 auto;
  width: 100%;
  max-width: 1120px;
  padding: 0 1rem;
`
