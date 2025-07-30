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

//Texture Loader
let textureLoader = new THREE.TextureLoader()
let ballTexture = textureLoader.load('/ball_texture.jpg')

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
renderer.shadowMap.enabled = true

//Scene
const scene = new THREE.Scene()

//Camera Settings
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height) // FOV vertical angle, aspect ratio with/height
camera.position.set(10,10,10)
scene.add(camera)

const controls = new OrbitControls( camera, canvas )

const spotLight = new THREE.SpotLight(0xffffff, 10, 1000, Math.PI * 0.4, 0.25, 1)

spotLight.position.set(0,15,0)
spotLight.castShadow = true
spotLight.shadow.radius = 5
spotLight.shadow.mapSize.width = 2048
spotLight.shadow.mapSize.height = 2048
scene.add(spotLight)


//My Scene
// Use the RAPIER module here.
let gravity = { x: 0.0, y: -9.81, z: 0.0 }
let world = new RAPIER.World(gravity)

// Create the ground
let groundColliderDesc = RAPIER.ColliderDesc.cuboid(100.0, 0.1, 100.0);
world.createCollider(groundColliderDesc);

// Create a dynamic rigid-body.
let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(0.0, 1.0, 0.0)
    .setLinvel(-5.0, 10.0, -5.0)
    .setAngvel({ x: 3.0, y: 3.0, z: 3.0 })
    .setAdditionalMass(0.3)
    .setLinearDamping(0.2)
    .setAngularDamping(0.2)
let rigidBody = world.createRigidBody(rigidBodyDesc)
rigidBody.addForce({ x: -2.0, y: 10.0, z: 0.0 }, true)


// Create a cuboid collider attached to the dynamic rigidBody.
let colliderDesc = RAPIER.ColliderDesc.ball(1).setDensity(1)
let collider = world.createCollider(colliderDesc, rigidBody)


let ballMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 32),
    new THREE.MeshPhongMaterial({
        map: ballTexture
    })
)
ballMesh.castShadow = true
ballMesh.position.copy(rigidBody.translation())
scene.add(ballMesh)


let floor = new THREE.Mesh(
    new THREE.BoxGeometry(100,0.05,100),
    new THREE.MeshPhongMaterial()
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
    //console.log("Rigid-body position: ", position.x, position.y);

    ballMesh.position.copy(rigidBody.translation())
    ballMesh.setRotationFromQuaternion(rigidBody.rotation())

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