import './App.css'
import { Canvas} from '@react-three/fiber'
import { Scene } from './components/Scene'

function App() {

  

  return (
    <div className="canvas-container">

      <Canvas camera={{
        fov: 75,
        near: 0.1,
        far: 1000,
        position: [0, 1, 5]
      }}>

        <Scene />

      </Canvas>
    </div>
  )
}

export default App
