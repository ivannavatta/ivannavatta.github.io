import monoFont from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff?url'
import { Billboard, RoundedBox, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { useIconTexture } from '../../hooks/useIconTexture'

/** Chip 3D con el logo y el nombre de una tecnología. Siempre mira a la cámara. */
function TechChip({ tech }) {
  const texture = useIconTexture(tech.icon, tech.color)

  return (
    <Billboard>
      <RoundedBox args={[0.58, 0.58, 0.08]} radius={0.13} smoothness={4}>
        <meshStandardMaterial
          color="#120f22"
          emissive={tech.color}
          emissiveIntensity={0.16}
          roughness={0.4}
          metalness={0.35}
        />
      </RoundedBox>
      <mesh position={[0, 0, 0.045]}>
        <planeGeometry args={[0.34, 0.34]} />
        <meshBasicMaterial map={texture} transparent toneMapped={false} />
      </mesh>
      <Text
        font={monoFont}
        fontSize={0.09}
        color="#e9e5ff"
        anchorX="center"
        anchorY="top"
        position={[0, -0.38, 0]}
        outlineWidth={0.006}
        outlineColor="#07060d"
      >
        {tech.name}
      </Text>
    </Billboard>
  )
}

/**
 * Tecnologías orbitando alrededor del editor en una elipse inclinada:
 * pasan por delante y por detrás de la ventana de código.
 */
export function TechOrbit({ technologies, radiusX = 2.75, radiusZ = 1.5, tilt = 0.5, speed = 0.18, animated = true }) {
  const chips = useRef([])
  const elapsed = useRef(0)

  useFrame((_, delta) => {
    if (animated) elapsed.current += delta
    const t = elapsed.current
    chips.current.forEach((chip, index) => {
      if (!chip) return
      const angle = (index / technologies.length) * Math.PI * 2 + t * speed
      chip.position.set(
        Math.cos(angle) * radiusX,
        -Math.sin(angle) * tilt + Math.sin(t * 1.4 + index) * 0.06,
        Math.sin(angle) * radiusZ,
      )
    })
  })

  return technologies.map((tech, index) => (
    <group key={tech.name} ref={(element) => (chips.current[index] = element)}>
      <TechChip tech={tech} />
    </group>
  ))
}
