import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  life: number
}

const MAX_PARTICLES = 50
const THROTTLE_MS = 100

function generateColors(): string[] {
  return Array.from({ length: 10 }, () => {
    const c = [
      255,
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
    ].sort(() => 0.5 - Math.random())
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
  })
}

// 별 모양 (십자형) 그리기
function drawStar(ctx: CanvasRenderingContext2D, p: Particle) {
  const s = p.size
  const x = p.x - s / 2
  const y = p.y - s / 2
  const a = s * 0.4
  const b = s * 0.6

  ctx.fillStyle = p.color
  ctx.beginPath()
  ctx.moveTo(x + a, y)
  ctx.lineTo(x + b, y)
  ctx.lineTo(x + b, y + a)
  ctx.lineTo(x + s, y + a)
  ctx.lineTo(x + s, y + b)
  ctx.lineTo(x + b, y + b)
  ctx.lineTo(x + b, y + s)
  ctx.lineTo(x + a, y + s)
  ctx.lineTo(x + a, y + b)
  ctx.lineTo(x, y + b)
  ctx.lineTo(x, y + a)
  ctx.lineTo(x + a, y + a)
  ctx.closePath()
  ctx.fill()
}

const Sparkle = (): JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const particles: Particle[] = []
    const colors = generateColors()
    let animationId = 0
    let lastTime = 0
    let lastSpawn = 0
    let isActive = true

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()

    window.addEventListener("resize", resize, { passive: true })

    const onVisibilityChange = () => {
      isActive = !document.hidden
      if (isActive) lastTime = performance.now()
    }
    document.addEventListener("visibilitychange", onVisibilityChange)

    const onMouseMove = (e: MouseEvent) => {
      if (!isActive) return
      const now = Date.now()
      if (now - lastSpawn < THROTTLE_MS) return
      if (particles.length >= MAX_PARTICLES) return

      lastSpawn = now
      particles.push({
        x: e.clientX,
        y: e.clientY,
        vx: (Math.random() - 0.5) * 2,
        vy: 1 + Math.random() * 3,
        size: 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
      })
    }
    document.addEventListener("mousemove", onMouseMove, { passive: true })

    const loop = (time: number) => {
      animationId = requestAnimationFrame(loop)

      if (!isActive) return
      if (!lastTime) {
        lastTime = time
        return
      }

      const dt = (time - lastTime) / 16.67
      lastTime = time

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      let i = particles.length
      while (i--) {
        const p = particles[i]
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.life += 0.5 * dt
        if (p.size > 2) p.size -= 0.05 * dt

        if (p.size <= 2 && p.life >= 100) {
          particles.splice(i, 1)
          continue
        }

        drawStar(ctx, p)
      }
    }

    animationId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animationId)
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("visibilitychange", onVisibilityChange)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  )
}

export default Sparkle
