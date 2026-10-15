import { Float, Sparkles } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useRef } from 'react'
import { technologyList } from '@/shared/data/technologies'
import { useMousePosition } from '@/shared/hooks'
import { CodeEditor } from './scene/CodeEditor'
import { SyntaxSymbols } from './scene/SyntaxSymbols'
import { TechOrbit } from './scene/TechOrbit'

// Ancho (en unidades 3D) que necesita la escena completa para verse sin cortes
const SCENE_WIDTH = 6.8

/** Escala la escena según el tamaño del canvas y la rota suavemente siguiendo al mouse. */
function Rig({ children, mouse, intensity }) {
  const group = useRef(null)
  const { viewport } = useThree()
  const scale = Math.min(1, viewport.width / SCENE_WIDTH)

  useFrame((_, delta) => {
    if (!group.current) return
    const ease = Math.min(1, delta * 2.5)
    group.current.rotation.y += (mouse.current.x * intensity - group.current.rotation.y) * ease
    group.current.rotation.x += (-mouse.current.y * intensity * 0.5 - group.current.rotation.x) * ease
  })

  return (
    <group ref={group} scale={scale}>
      {children}
    </group>
  )
}

export default function Scene3D({ active = true, animated = true, ready = true, isMobile = false }) {
  const mouse = useMousePosition()

  return (
    <Canvas
      dpr={[1, isMobile ? 1.5 : 2]}
      camera={{ position: [0, 0, 7.5], fov: 45 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      frameloop={active && animated ? 'always' : 'demand'}
      aria-hidden="true"
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 6]} intensity={1.6} />
      <pointLight position={[-4, -2, 3]} intensity={30} color="#22d3ee" />
      <pointLight position={[4, 2, 2]} intensity={30} color="#a855f7" />

      {/* Suspense: los textos esperan a que cargue la fuente monoespaciada */}
      <Suspense fallback={null}>
        <Rig mouse={mouse} intensity={animated ? 0.25 : 0}>
          <Float speed={animated ? 1.4 : 0} rotationIntensity={animated ? 0.15 : 0} floatIntensity={animated ? 0.4 : 0}>
            <group rotation={[0.05, -0.18, 0]}>
              <CodeEditor animated={animated} running={active && ready} />
            </group>
          </Float>
          <TechOrbit technologies={technologyList} animated={animated} />
          <SyntaxSymbols animated={animated} />
        </Rig>
      </Suspense>

      <Sparkles
        count={isMobile ? 30 : 70}
        scale={[12, 7, 6]}
        size={2}
        speed={animated ? 0.3 : 0}
        opacity={0.6}
        color="#c4b5fd"
      />
    </Canvas>
  )
}
