import * as THREE from 'three'
import gsap from 'gsap'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import {Pane} from 'tweakpane'

console.log('Particles Lesson')

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
camera.position.set(1,1,1)
scene.add(camera)

const controls = new OrbitControls( camera, canvas )



//My Scene
const particlesCount = 500
const particleObject = {
    geometry: new THREE.BufferGeometry(),
    positionArray: new Float32Array(particlesCount * 3),
    material: new THREE.PointsMaterial({
                                                    size: 1,
                                                    sizeAttenuation: false
                                            })
}


for (let i = 0; i < particlesCount; i++) {
    particleObject.positionArray[i] = (Math.random() - 0.5) * 10

}

particleObject.geometry.setAttribute('position', new THREE.BufferAttribute(particleObject.positionArray, 3))


const particles = new THREE.Points(particleObject.geometry, particleObject.material)
scene.add(particles)






//Animation Loop Function
const tick = () => {

    const elapsedTime = clock.getElapsedTime() //Built in function in seconds since start

    camera.lookAt(new THREE.Vector3()) //Empty Vector3 method resul in 0 0 0  Vector, basically center of the scene

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