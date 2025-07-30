import * as THREE from 'three'
import gsap from 'gsap'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import {Pane} from 'tweakpane'
import RAPIER from '@dimforge/rapier3d'

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
camera.position.set(5,5,5)
scene.add(camera)

const controls = new OrbitControls( camera, canvas )

const spotLight = new THREE.SpotLight(0xDCE1ED, 10, 10, Math.PI * 0.5, 0, 1)
spotLight.position.set(0,5,0)
scene.add(spotLight)

const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5)
scene.add(ambientLight)

//My Scene
// Use the RAPIER module here.
let gravity = { x: 0.0, y: -9.81, z: 0.0 };
let world = new RAPIER.World(gravity);

// Create the ground
let groundColliderDesc = RAPIER.ColliderDesc.cuboid(10.0, 0.1, 10.0);
world.createCollider(groundColliderDesc);

// Create a dynamic rigid-body.
let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(0.0, 5.0, 0.0)
let rigidBody = world.createRigidBody(rigidBodyDesc);

// Create a cuboid collider attached to the dynamic rigidBody.
let colliderDesc = RAPIER.ColliderDesc.cuboid(1,1,1);
let collider = world.createCollider(colliderDesc, rigidBody);


let cubeMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1,1,1),
    new THREE.MeshPhongMaterial()
)
cubeMesh.castShadow = true
cubeMesh.position.copy(rigidBody.translation())
scene.add(cubeMesh)


let floor = new THREE.Mesh(
    new THREE.BoxGeometry(10,0.1,10),
    new THREE.MeshPhongMaterial({color: '#DDDDDD'})
)
floor.receiveShadow = true
floor.position.copy(groundColliderDesc.translation)
console.log(groundColliderDesc)
scene.add(floor)







//Animation Loop Function
const tick = () => {
    // Step the simulation forward.  
    world.step();

    // Get and print the rigid-body's position.
    let position = rigidBody.translation();
    console.log("Rigid-body position: ", position.x, position.y);

    cubeMesh.position.copy(rigidBody.translation())


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