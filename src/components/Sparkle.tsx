import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"

interface StarOrDot {
  id: number // key 최적화를 위한 고유 ID
  left: number
  top: number
  color: string
  visible: boolean
  size: number
  life: number
  velocity?: { x: number; y: number } // 속도 계산
}

function throttle<F extends (...args: any[]) => any>(
  func: F,
  limit: number
): (...args: Parameters<F>) => void {
  let lastFunc: number
  let lastRan: number

  return function (this: ThisParameterType<F>, ...args: Parameters<F>) {
    const context = this
    if (!lastRan) {
      func.apply(context, args)
      lastRan = Date.now()
    } else {
      clearTimeout(lastFunc)
      lastFunc = window.setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func.apply(context, args)
          lastRan = Date.now()
        }
      }, limit - (Date.now() - lastRan))
    }
  }
}

const Sparkle = (): JSX.Element => {
  const sparkles = 50
  const [stars, setStars] = useState<StarOrDot[]>([])
  const [tinyDots, setTinyDots] = useState<StarOrDot[]>([])
  const animationFrameRef = useRef<number>()
  const lastUpdateTimeRef = useRef<number>(0)
  const idCounterRef = useRef<number>(0)
  const isActiveRef = useRef<boolean>(true)

  // 색상 생성 (메모화)
  const colors = useMemo(() => {
    return Array.from({ length: 10 }, () => {
      const c = [
        255,
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256),
      ].sort(() => 0.5 - Math.random())
      return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
    })
  }, [])

  const getRandomColor = useCallback(() => {
    return colors[Math.floor(Math.random() * colors.length)]
  }, [colors])

  // 페이지 가시성 감지
  useEffect(() => {
    const handleVisibilityChange = () => {
      isActiveRef.current = !document.hidden
      if (!document.hidden && animationFrameRef.current) {
        lastUpdateTimeRef.current = performance.now()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    // 마우스 움직임 핸들러 : 화면에 최대 별 개수에 도달하지 않았을 때 새 별을 추가
    const moveHandler = throttle((e: MouseEvent) => {
      if (!isActiveRef.current) return

      if (stars.length < sparkles) {
        const newStar: StarOrDot = {
          id: idCounterRef.current++,
          left: e.pageX,
          top: e.pageY,
          color: getRandomColor(),
          visible: true,
          size: 5,
          life: 0,
          velocity: {
            x: (Math.random() - 0.5) * 2,
            y: 1 + Math.random() * 3,
          },
        }

        setStars((prevStars) => [...prevStars, newStar])
      }
    }, 100) // throttle 시간 조절

    document.addEventListener("mousemove", moveHandler, { passive: true })
    return () => document.removeEventListener("mousemove", moveHandler)
  }, [stars.length, getRandomColor])

  // 애니메이션 최적화
  useEffect(() => {
    const update = (currentTime: number) => {
      if (!isActiveRef.current) {
        animationFrameRef.current = requestAnimationFrame(update)
        return
      }

      // 60fps로 제한 (16.67ms)
      if (currentTime - lastUpdateTimeRef.current < 16.67) {
        animationFrameRef.current = requestAnimationFrame(update)
        return
      }

      const deltaTime = currentTime - lastUpdateTimeRef.current
      lastUpdateTimeRef.current = currentTime

      const [updatedStars, updatedTinyDots] = updateStarsAndDots(
        stars,
        tinyDots,
        deltaTime
      )

      setStars(updatedStars)
      setTinyDots(updatedTinyDots)

      animationFrameRef.current = requestAnimationFrame(update)
    }

    if (stars.length > 0 || tinyDots.length > 0) {
      animationFrameRef.current = requestAnimationFrame(update)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [stars, tinyDots]) // 별과 작은 점 상태 업데이트에 따라 애니메이션 갱신

  return (
    <>
      {stars.map((star) => (
        <Star key={star.id} {...star} />
      ))}
      {tinyDots.map((dot) => (
        <TinyDot key={dot.id} {...dot} />
      ))}
    </>
  )
}

// 초기 별 생성 및 상태 설정
const Star = React.memo<StarOrDot>(({ left, top, color, visible, size }) => (
  <div
    style={{
      position: "absolute",
      left: `${left}px`,
      top: `${top}px`,
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: color,
      visibility: visible ? "visible" : "hidden",
      zIndex: 9999,
      // 별 모양을 위한 스타일
      clipPath:
        "polygon(40% 0%, 60% 0%, 60% 40%, 100% 40%, 100% 60%, 60% 60%, 60% 100%, 40% 100%, 40% 60%, 0% 60%, 0% 40%, 40% 40%)",
    }}
  />
))

Star.displayName = "Star"

// 작은 점 생성 및 상태 설정
const TinyDot = React.memo<StarOrDot>(({ left, top, color, visible }) => (
  <div
    style={{
      position: "absolute",
      left: `${left}px`,
      top: `${top}px`,
      width: "2px",
      height: "2px",
      backgroundColor: color,
      visibility: visible ? "visible" : "hidden",
      zIndex: 9999,
    }}
  />
))

TinyDot.displayName = "TinyDot"

const updateStarsAndDots = (
  stars: StarOrDot[],
  tinyDots: StarOrDot[],
  deltaTime: number
): [StarOrDot[], StarOrDot[]] => {
  const timeFactor = deltaTime / 16.67 // 60fps 기준 정규화

  // 별과 작은 점의 위치 및 가시성 업데이트
  const updatedStars: StarOrDot[] = []
  const newTinyDots: StarOrDot[] = [...tinyDots]

  for (const star of stars) {
    const newLife = star.life + 0.5 * timeFactor
    const newSize = star.size > 2 ? star.size - 0.05 * timeFactor : 2
    const isVisible = star.size > 2

    if (newSize > 2 || newLife < 100) {
      updatedStars.push({
        ...star,
        top: star.top + (star.velocity?.y || 1) * timeFactor,
        left: star.left + (star.velocity?.x || 0) * timeFactor,
        visible: isVisible,
        size: newSize,
        life: newLife,
      })
    }
  }

  // 작은 점들 필터링 최적화
  const updatedTinyDots = newTinyDots
    .map((dot) => ({
      ...dot,
      life: dot.life + 0.5 * timeFactor, // 점의 수명 증가량 조절
    }))
    .filter((dot) => dot.life < 100) // 점이 사라지는 조건 조절

  return [updatedStars, updatedTinyDots]
}

export default Sparkle
