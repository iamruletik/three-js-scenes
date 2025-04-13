import * as THREE from 'three'
import gsap from 'gsap'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import {Pane} from 'tweakpane'

console.log('Particles Lesson')

//TweakPane Gui
const pane = new Pane()
const tweaks = pane.addFolder({ 
                                        title: 'Galaxy Generator' 
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

//Texture Loader
const textureLoader = new THREE.TextureLoader()

//Scene
const scene = new THREE.Scene()

//Camera Settings
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height) // FOV vertical angle, aspect ratio with/height
camera.position.set(1,1,1)
scene.add(camera)

const controls = new OrbitControls( camera, canvas )

///Texture
const stellarTexture = textureLoader.load('/stellar_particle.jpg')

//My Scene
const particles = {
    size: 0.015,
    count: 50000,
    positions: [],
    geometry: null,
    color: 0x888888,
    material: new THREE.PointsMaterial({
        sizeAttenuation: true,
        depthWrite: true,
        blending: THREE.AdditiveBlending,
        alphaMap: stellarTexture,
        transparent: true,
        alphaTest: 0.5,
        vertexColors: true 
    }),
    points: null,
    radius: 2,
    branches: 7,
    spin: 1,
    randomness: 0.1,
    randomnessPower: 5,
    insideColor: '#92A4FF',
    outsideColor: '#FF0033',
    colors: []
}

const generateGalaxy = () => {


    //Free Memory of Old Geometry
    if (particles.points != null) {
        particles.geometry.dispose()
        scene.remove(particles.points)
    }

    particles.material.size = particles.size
    particles.material.color = new THREE.Color().setHex(particles.color)
    particles.positions = new Float32Array(particles.count * 3)
    particles.colors = new Float32Array(particles.count * 3)

    const colorInside = new THREE.Color(particles.insideColor)
    const colorOutside = new THREE.Color(particles.outsideColor)

    //Randomize Positions
    for (let i = 0; i < particles.count; i++) {

        const c = i * 3

        //Position
        const radius = Math.random() * particles.radius
        const spinAngle = radius * particles.spin
        const branchAngle = (i % particles.branches) / particles.branches * Math.PI * 2 

        const randomX = Math.pow(Math.random() , particles.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)
        const randomY = Math.pow(Math.random(), particles.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)
        const randomZ = Math.pow(Math.random(), particles.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)

        particles.positions[c    ] = Math.cos(branchAngle + spinAngle) * radius + randomX
        particles.positions[c + 1] = randomY / 3
        particles.positions[c + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ


        //Color
        const mixedColor = colorInside.clone()
        mixedColor.lerp(colorOutside, radius / particles.radius)

        particles.colors[c    ] = mixedColor.r
        particles.colors[c + 1] = mixedColor.g
        particles.colors[c + 2] = mixedColor.b




    }

    particles.geometry = new THREE.BufferGeometry()
    particles.geometry.setAttribute('position', new THREE.BufferAttribute(particles.positions, 3))
    particles.geometry.setAttribute('color', new THREE.BufferAttribute(particles.colors, 3))

    particles.points = new THREE.Points(particles.geometry, particles.material)
    scene.add(particles. points)
}
generateGalaxy()



tweaks.addBinding(particles, 'radius', { min: 1, max: 1000, step: 1 }).on('change', (ev) => {if (ev.last) { generateGalaxy() } })
tweaks.addBinding(particles, 'branches', { min: 1, max: 20 , step: 1 }).on('change', (ev) => {if (ev.last) { generateGalaxy() } })
tweaks.addBinding(particles, 'spin', { min: -20, max: 20 , step: 1 }).on('change', (ev) => {if (ev.last) { generateGalaxy() } })
tweaks.addBinding(particles, 'count', { min: 1000, max: 1000000, step: 1 }).on('change', (ev) => {if (ev.last) { generateGalaxy() } })
tweaks.addBinding(particles, 'randomness', { min: 0, max: 2, step: 0.01 }).on('change', (ev) => {if (ev.last) { generateGalaxy() } })
tweaks.addBinding(particles, 'randomnessPower', { min: 1, max: 10, step: 0.001 }).on('change', (ev) => {if (ev.last) { generateGalaxy() } })
tweaks.addBinding(particles, 'size', { min: 0, max: 0.5, step: 0.001 }).on('change', (ev) => {if (ev.last) { generateGalaxy() } }) //ev.last is the onFinish
tweaks.addBinding(particles, 'color', {view: 'color'}).on('change', (ev) => {if (ev.last) { generateGalaxy() } })





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