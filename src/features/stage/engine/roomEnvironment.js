// Habitación de luz para el reflejo de los bloques: copia de RoomEnvironment de three r170
// (MIT, © three.js authors; basada en EnvironmentScene de google/model-viewer).
// three r186 cambió esta escena (materiales Lambert, otra altura) y los bloques salían
// ~20 % más claros que en el mockup aprobado, que usaba r170. Con esta copia se ven igual.
import { BackSide, BoxGeometry, Mesh, MeshBasicMaterial, MeshStandardMaterial, PointLight, Scene } from 'three'

// [posición, rotación Y, escala]
const BOXES = [
  [[-10.906, 2.009, 1.846], -0.195, [2.328, 7.905, 4.651]],
  [[-5.607, -0.754, -0.758], 0.994, [1.97, 1.534, 3.955]],
  [[6.167, 0.857, 7.803], 0.561, [3.927, 6.285, 3.687]],
  [[-2.017, 0.018, 6.124], 0.333, [2.002, 4.566, 2.064]],
  [[2.291, -0.756, -2.621], -0.286, [1.546, 1.552, 1.496]],
  [[-2.193, -0.369, -5.547], 0.516, [3.875, 3.487, 2.986]],
]

// [intensidad, posición, escala]: paneles emisivos que hacen de luces de área
const AREA_LIGHTS = [
  [50, [-16.116, 14.37, 8.208], [0.1, 2.428, 2.739]],
  [50, [-16.109, 18.021, -8.207], [0.1, 2.425, 2.751]],
  [17, [14.904, 12.198, -1.832], [0.15, 4.265, 6.331]],
  [43, [-0.462, 8.89, 14.52], [4.38, 5.441, 0.088]],
  [20, [3.235, 11.486, -12.541], [2.5, 2.0, 0.1]],
  [100, [0.0, 20.0, 0.0], [1.0, 0.1, 1.0]],
]

export class RoomEnvironment extends Scene {
  constructor() {
    super()
    const geometry = new BoxGeometry()
    geometry.deleteAttribute('uv')
    const roomMaterial = new MeshStandardMaterial({ side: BackSide })
    const boxMaterial = new MeshStandardMaterial()

    const mainLight = new PointLight(0xffffff, 900, 28, 2)
    mainLight.position.set(0.418, 16.199, 0.3)
    this.add(mainLight)

    const room = new Mesh(geometry, roomMaterial)
    room.position.set(-0.757, 13.219, 0.717)
    room.scale.set(31.713, 28.305, 28.591)
    this.add(room)

    for (const [position, rotationY, scale] of BOXES) {
      const box = new Mesh(geometry, boxMaterial)
      box.position.set(...position)
      box.rotation.set(0, rotationY, 0)
      box.scale.set(...scale)
      this.add(box)
    }

    for (const [intensity, position, scale] of AREA_LIGHTS) {
      const material = new MeshBasicMaterial()
      material.color.setScalar(intensity)
      const light = new Mesh(geometry, material)
      light.position.set(...position)
      light.scale.set(...scale)
      this.add(light)
    }
  }

  dispose() {
    const resources = new Set()
    this.traverse((object) => {
      if (object.isMesh) {
        resources.add(object.geometry)
        resources.add(object.material)
      }
    })
    for (const resource of resources) resource.dispose()
  }
}
