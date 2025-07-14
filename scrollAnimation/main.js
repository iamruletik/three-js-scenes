import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js' 
import {Pane} from 'tweakpane'
import gsap from 'gsap'


//TweakPane Gui
const pane = new Pane()
const paneFolder = pane.addFolder({ 
                                        title: 'Tweakpane GUI' 
                                    })

//Canvas Element
const canvas = document.querySelector('canvas.webgl')
const clock = new THREE.Clock()
//Sizes
const sizes = {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
//Renderer
const renderer = new THREE.WebGLRenderer({
                                                canvas: canvas
                                            })
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))//Setting pixel ratio 

//Scene
const scene = new THREE.Scene()

//Camera Settings
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height) // FOV vertical angle, aspect ratio with/height
camera.position.set(30,30,30)
scene.add(camera)

const ambient = new THREE.AmbientLight(0xFFFFFF, 1)
const directional = new THREE.DirectionalLight(0xFFFFFF, 1)
directional.position.set(2,8,-3)
paneFolder.addBinding(directional.position, "x")
paneFolder.addBinding(directional.position, "y")
paneFolder.addBinding(directional.position, "z")
//scene.add(ambient, directional)

const controls = new OrbitControls( camera, canvas )

let mixer = null

const exrLoader = new EXRLoader()
exrLoader.load('/macbook-hdri.exr', (environmentMap) => {
    console.log(environmentMap)
    environmentMap.mapping = THREE.EquirectangularReflectionMapping
    //scene.background = environmentMap
    scene.environment = environmentMap
    scene.environmentIntensity = 0.4
    //scene.backgroundIntensity = 0.02
}) 

const dracoLoader = new DRACOLoader() 
dracoLoader.setDecoderPath('/draco/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)



gltfLoader.load(
    //'/macbookModel/macbookOptimized.gltf',
    //'/macbookModel/macbookOptimized.glb',
    //'/macbookOptimizedCompressed.glb',
    '/macbookDracoAnimated.glb',
    
    (gltf) => {
        console.log(gltf)
        mixer = new THREE.AnimationMixer(gltf.scene)
        const action = mixer.clipAction(gltf.animations[0])
        action.setLoop(THREE.LoopOnce)
        action.clampWhenFinished = true
        action.play()
        const children = [...gltf.scene.children]

    
        for (const child of children) {
            scene.add(child)
        }
    }
)

//My Scene















let previousTime = 0

//Animation Loop Function
const tick = () => {

    const elapsedTime = clock.getElapsedTime() //Built in function in seconds since start
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    camera.lookAt(new THREE.Vector3()) //Empty Vector3 method resul in 0 0 0  Vector, basically center of the scene

    //Update Mixer
    if (mixer !== null) { mixer.update(deltaTime) }
    

    //Render Function
    renderer.render(scene, camera) //by default all objects will appear at center of the scene in 0 0 0 coordinates, meaning camera will be at the center too

    //Request next frame
    window.requestAnimationFrame(tick) // requestAnimationFrame purpose is to call a function on the next frame, thus we will need to call this function each frame
    controls.update()
}
tick()



//Resize Function
window.addEventListener('resize', () => {
    
    //Update Sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    //Update Camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix() // Update Camera

    renderer.setSize(sizes.width, sizes.height) //Update Renderer - Better put here so user when moving windows from screen to screen would recieve better expirience

})