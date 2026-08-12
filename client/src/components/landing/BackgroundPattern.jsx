import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export function BackgroundPattern() {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
      {/* High-visibility Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808022_1px,transparent_1px),linear-gradient(to_bottom,#80808022_1px,transparent_1px)] bg-[size:36px_36px] opacity-80" />

      {/* Mouse Tracking Spotlight */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(650px circle at ${mousePos.x}px ${mousePos.y}px, rgba(140, 140, 140, 0.12), transparent 75%)`,
        }}
      />

      {/* Floating Animated Ambient Orbs */}
      <motion.div
        animate={{
          x: [0, 70, -50, 0],
          y: [0, -50, 50, 0],
          scale: [1, 1.12, 0.92, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-32 left-1/4 size-[550px] rounded-full bg-foreground/6 blur-[120px]"
      />

      <motion.div
        animate={{
          x: [0, -60, 60, 0],
          y: [0, 70, -40, 0],
          scale: [1, 0.88, 1.15, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/3 right-1/6 size-[500px] rounded-full bg-foreground/5 blur-[130px]"
      />

      <motion.div
        animate={{
          x: [0, 40, -40, 0],
          y: [0, 60, -60, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute bottom-1/4 left-1/3 size-[450px] rounded-full bg-foreground/5 blur-[125px]"
      />
    </div>
  )
}
