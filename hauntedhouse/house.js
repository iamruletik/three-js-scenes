import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js' //Utils For Workinng with geometries (like updating normals)
import * as TextureUtils from 'three/src/extras/TextureUtils.js'
import gsap from 'gsap'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import {Pane} from 'tweakpane'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js' //RGBE Loader for a environment map
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js'

console.log(TextureUtils)

//TweakPane Gui
const pane = new Pane()
const tweaks = pane.addFolder({ 
                                        title: 'PixelPass' 
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
                                                canvas: canvas,
                                            })
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))//Setting pixel ratio 
renderer.shadowMap.enabled = true


//TextureLoader
const textureLoader = new THREE.TextureLoader()

//Scene
const scene = new THREE.Scene()
scene.fog = new THREE.FogExp2('#1B1E23', 0.1)
//scene.fog = new THREE.Fog('#1B1E23', 0.5, 15)
const rgbeLoader = new RGBELoader()
rgbeLoader.load('/hauntedhouse/hdri.hdr', (environmentMap) => {
    console.log(environmentMap)
    environmentMap.mapping = THREE.EquirectangularReflectionMapping
    scene.background = environmentMap
    scene.environment = environmentMap
    scene.environmentIntensity = 0.2
    scene.backgroundIntensity = 0.02
}) 

//Camera Settings
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height) // FOV vertical angle, aspect ratio with/height
camera.position.set(7,0.7,-2)
scene.add(camera)

const controls = new OrbitControls( camera, canvas )



//My Scene


const testTexture = textureLoader.load('/hauntedhouse/board.jpg')
testTexture.colorSpace = THREE.SRGBColorSpace
testTexture.minFilter = THREE.NearestFilter
testTexture.magFilter = THREE.NearestFilter
testTexture.wrapS = THREE.RepeatWrapping
testTexture.wrapT = THREE.RepeatWrapping

const floorAlphaTexture = textureLoader.load('/hauntedhouse/alpha.jpg')
const floorTexture = textureLoader.load('/hauntedhouse/grass2.png')
const floorNormalTexture = textureLoader.load('/hauntedhouse/grass2-normal.png')
floorTexture.colorSpace = THREE.SRGBColorSpace
floorTexture.wrapS = THREE.RepeatWrapping
floorTexture.wrapT = THREE.RepeatWrapping
floorNormalTexture.wrapS = THREE.RepeatWrapping
floorNormalTexture.wrapT = THREE.RepeatWrapping
floorTexture.repeat.set(8,8)
floorNormalTexture.repeat.set(8,8)



//const basicMaterial = new THREE.MeshPhongMaterial({ wireframe: false, map: TextureUtils.cover(testTexture)})
const basicTexture = textureLoader.load('/hauntedhouse/baseColor.jpg')
basicTexture.colorSpace = THREE.SRGBColorSpace
basicTexture.wrapS = THREE.RepeatWrapping
basicTexture.wrapT = THREE.RepeatWrapping
const basicMaterial = new THREE.MeshPhongMaterial({
                                                            map: basicTexture,
                                                            //color: 0xBBA99E
})
const floorMaterial = new THREE.MeshPhongMaterial({ 
                                                            alphaMap: floorAlphaTexture, 
                                                            transparent: true, 
                                                            map: floorTexture,
                                                            normalMap: floorNormalTexture
})


//FLOOR GROUP
const floorMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    floorMaterial
)
floorMesh.rotation.x = - Math.PI * 0.5
floorMesh.receiveShadow = true

const floorGroup = new THREE.Group()
floorGroup.add(floorMesh)
scene.add(floorGroup)


//Grass
const grassBladesAlphaTexture = textureLoader.load('/hauntedhouse/grass_blades.jpg')
const grassBladesColorTexture = textureLoader.load('/hauntedhouse/grass_blades_color.jpg')
grassBladesColorTexture.colorSpace = THREE.SRGBColorSpace
grassBladesColorTexture.minFilter = THREE.NearestFilter
grassBladesColorTexture.magFilter = THREE.NearestFilter
const grassBladesMaterial = new THREE.MeshPhongMaterial({ 
                                                                alphaMap: grassBladesAlphaTexture, 
                                                                transparent: true, 
                                                                map: grassBladesColorTexture,
                                                                side: THREE.DoubleSide, 
                                                                depthWrite: true,
                                                                alphaTest: 0.7 
})

const grassBladesSizes = {
    width: 0.25,
    height: 0.25,
}

const grassBladeSideGeometry = new THREE.PlaneGeometry(grassBladesSizes.width, grassBladesSizes.height)
const instanceCount = 25000
const grassBladeMesh = new THREE.InstancedMesh(grassBladeSideGeometry,grassBladesMaterial, instanceCount)
const grassBladeMeshB = new THREE.InstancedMesh(grassBladeSideGeometry,grassBladesMaterial, instanceCount)
const positionMatrix = new THREE.Matrix4()
grassBladeMesh.position.y = grassBladesSizes.height / 1
grassBladeMeshB.position.y = grassBladesSizes.height / 1
grassBladeMeshB.scale.y += 1.05
grassBladeMesh.frustumCulled = false
grassBladeMeshB.frustumCulled = false

for (let i = 0; i < instanceCount; i++) {

    let angle = Math.random() * Math.PI * 2
    let radius = 2 + Math.random() * 18
    let x = Math.sin(angle) * radius
    let z = Math.cos(angle) * radius

    positionMatrix.makeRotationY(angle)
    positionMatrix.setPosition(x, 0, z)

    //grassBladeMesh.rotation.y = angle
    
    grassBladeMesh.setMatrixAt(i, positionMatrix)
    grassBladeMeshB.setMatrixAt(i, positionMatrix)

}

grassBladeMeshB.rotation.y += Math.PI / 2
floorGroup.add(grassBladeMesh,grassBladeMeshB)


//HOUSE
//House Base
const houseBaseColorTexture = textureLoader.load('/hauntedhouse/wall.jpg')
const houseBaseNormal = textureLoader.load('/hauntedhouse/wall-normal-2.png')
houseBaseColorTexture.colorSpace = THREE.SRGBColorSpace
houseBaseColorTexture.minFilter = THREE.NearestFilter
houseBaseColorTexture.magFilter = THREE.NearestFilter
houseBaseColorTexture.wrapS = THREE.RepeatWrapping
houseBaseColorTexture.wrapT = THREE.RepeatWrapping
houseBaseColorTexture.repeat.set(1,12)
houseBaseNormal.wrapS = THREE.RepeatWrapping
houseBaseNormal.wrapT = THREE.RepeatWrapping
houseBaseNormal.repeat.set(1,12)
const hoseBaseMaterial = new THREE.MeshPhongMaterial({
                                                        map: houseBaseColorTexture,
                                                        normalMap: houseBaseNormal
})  



const houseMeasurements = {
    width: 3,
    height: 2.2,
    depth: 6
}

const houseBase = new THREE.Mesh(
    new THREE.BoxGeometry(houseMeasurements.width, houseMeasurements.height, houseMeasurements.depth),
    hoseBaseMaterial
)
houseBase.position.y += houseMeasurements.height * 0.5
houseBase.castShadow = true

const houseBaseGroup = new THREE.Group()
houseBaseGroup.add(houseBase)
scene.add(houseBaseGroup)


//House Roof
const roofMeasurements = {
    height: 1.2,
    offset: 0.2,
    slant: 0.5
}

houseBase.receiveShadow = true


//Roof Shape Geometry Test
const roofGroup = new THREE.Group()
scene.add(roofGroup)

const roofShape = new THREE.Shape() 

//Drawing Roof Shape
roofShape.moveTo(-houseMeasurements.width / 2, 0)
roofShape.lineTo(0,roofMeasurements.height)
roofShape.lineTo(houseMeasurements.width / 2, 0)

//Extrude Settings
const roofExtrudeSettings = { 
	depth: houseMeasurements.depth + roofMeasurements.offset * 2, 
	bevelEnabled: false, 
	steps: 1
}


//Extruding Geometry from Shape
let roofGeometry = new THREE.ExtrudeGeometry( roofShape, roofExtrudeSettings )


//Giving Roof Slant Dynamically (Looking for higher vertices and moving them)
const roofVerticesPositionAttribute = roofGeometry.getAttribute('position')
const tempVertex = new THREE.Vector3();

for ( let i = 0; i < roofVerticesPositionAttribute.count; i ++ ) {

    // Read Vertex from buffer
	tempVertex.fromBufferAttribute( roofVerticesPositionAttribute, i ); 

    //Looking for vertices that are higher than floor (Y > 0) and apply offset to give roof a slight slant
    if ((tempVertex.y > 0) && (tempVertex.x == 0)) {
        //console.log(tempVertex)
        roofVerticesPositionAttribute.setXYZ( i, tempVertex.x, tempVertex.y, Math.abs(tempVertex.z - roofMeasurements.slant)) // write coordinates back
    }

    //representVertices()
    function representVertices() {
        //Temp Cubes used for Vertices Representation via BoxGeometry and Random Color
        let tempCube = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.3, 0.3),
            new THREE.MeshBasicMaterial({color: new THREE.Color(Math.random(), Math.random() , Math.random() )})
        )
        tempCube.position.set(tempVertex.x, tempVertex.y + houseMeasurements.height, tempVertex.z - houseMeasurements.width + 0.15)
        scene.add(tempCube)
    }
}

//Merging Vertices to create indexed geometry
roofGeometry = BufferGeometryUtils.mergeVertices(roofGeometry,1)

//Textures
const roofMeshColor = textureLoader.load('/hauntedhouse/roof5.png')
const roofMeshNormal = textureLoader.load('/hauntedhouse/roof5-normal.png')
roofMeshColor.colorSpace = THREE.SRGBColorSpace
roofMeshColor.minFilter = THREE.NearestFilter
roofMeshColor.magFilter = THREE.NearestFilter
roofMeshColor.wrapS = THREE.RepeatWrapping
roofMeshColor.wrapT = THREE.RepeatWrapping
roofMeshColor.repeat.set(1,1)
roofMeshNormal.wrapS = THREE.RepeatWrapping
roofMeshNormal.wrapT = THREE.RepeatWrapping
roofMeshNormal.repeat.set(1,1)


const roofMeshMaterial = new THREE.MeshPhongMaterial({
                                                        map: roofMeshColor,
                                                        normalMap: roofMeshNormal
})

//Creating Mesh
const roofMesh = new THREE.Mesh(roofGeometry, roofMeshMaterial)
roofMesh.position.y += houseMeasurements.height
roofMesh.position.z -= (houseMeasurements.depth/2 + roofMeasurements.offset)
roofMesh.scale.x += roofMeasurements.offset
roofGroup.add(roofMesh)
//Check index of roof mesh
console.log(roofMesh.geometry.getIndex())



//Group for Second Part of Roof
const roofSecondPartGroup = new THREE.Group()
scene.add(roofSecondPartGroup)


//Roof Second Base Shape Geometry Test
const roofSecondShapeA = new THREE.Shape() 
const roofSecondShapeB = new THREE.Shape() 
const roofSecondShapeC = new THREE.Shape() 

const roofSecondShapeSettings = { 
    yOffset: 0,
    width: houseMeasurements.width / 1.9
}

//Drawing Roof Shape A
roofSecondShapeA.moveTo(-roofSecondShapeSettings.width, roofSecondShapeSettings.yOffset)
roofSecondShapeA.lineTo(0,roofMeasurements.height - roofSecondShapeSettings.yOffset)

//Drawing Roof Shape B
roofSecondShapeB.moveTo(roofSecondShapeSettings.width, roofSecondShapeSettings.yOffset)
roofSecondShapeB.lineTo(0,roofMeasurements.height - roofSecondShapeSettings.yOffset)

//Drawing Roof Shape C
roofSecondShapeC.moveTo(-roofSecondShapeSettings.width, roofSecondShapeSettings.yOffset)
roofSecondShapeC.lineTo(0,roofMeasurements.height - roofSecondShapeSettings.yOffset)
roofSecondShapeC.lineTo(roofSecondShapeSettings.width, roofSecondShapeSettings.yOffset)

//Extrude Settings
const roofSecondExtrudeSettings = { 
	depth: houseMeasurements.depth / 2.5 + roofMeasurements.offset * 2, 
	bevelEnabled: false, 
	steps: 1
}

//Extruding Geometry from Shape
let roofSecondGeometryA = new THREE.ExtrudeGeometry( roofSecondShapeA, roofSecondExtrudeSettings )
roofSecondGeometryA = BufferGeometryUtils.mergeVertices(roofSecondGeometryA,1)

let roofSecondGeometryB = new THREE.ExtrudeGeometry( roofSecondShapeB, roofSecondExtrudeSettings )
roofSecondGeometryB = BufferGeometryUtils.mergeVertices(roofSecondGeometryB,1)

let roofSecondGeometryC = new THREE.ExtrudeGeometry( roofSecondShapeC, roofSecondExtrudeSettings )
roofSecondGeometryC = BufferGeometryUtils.mergeVertices(roofSecondGeometryC,1)


//Creating Mesh
const roofSecondMeshA = new THREE.Mesh(roofSecondGeometryA, roofMeshMaterial)
roofSecondMeshA.position.y += houseMeasurements.height
roofSecondMeshA.rotation.y = Math.PI / 2
const roofSecondMeshB = new THREE.Mesh(roofSecondGeometryB, roofMeshMaterial)
roofSecondMeshB.position.y += houseMeasurements.height
roofSecondMeshB.rotation.y = Math.PI / 2

const roofSecondMeshCMaterial = new THREE.MeshPhongMaterial({ color: 0xAB978B})

const roofSecondMeshC = new THREE.Mesh(roofSecondGeometryC, roofSecondMeshCMaterial)
roofSecondMeshC.position.y += houseMeasurements.height - 0.001
roofSecondMeshC.rotation.y = Math.PI / 2
roofSecondMeshC.scale.z = 0.915

roofSecondMeshC.castShadow = true

roofSecondPartGroup.add(roofSecondMeshA, roofSecondMeshB, roofSecondMeshC)
roofSecondPartGroup.position.z += houseMeasurements.width / 2 //Poistion Second part of the roof 


//Create Porch
const porchGroup = new THREE.Group()
scene.add(porchGroup)

const porchBottomSizes = {
    width: 1,
    height: 0.4,
    depth: houseMeasurements.depth / 2
}

const porchBottom = new THREE.Mesh(
    new THREE.BoxGeometry(porchBottomSizes.width, porchBottomSizes.height, porchBottomSizes.depth),
    basicMaterial
)
porchBottom.position.y += porchBottomSizes.height / 2
porchBottom.position.z += porchBottomSizes.depth / 2
porchBottom.position.x = (houseMeasurements.width / 2 + porchBottomSizes.width / 2)

porchBottom.receiveShadow = true
porchBottom.castShadow = true

porchGroup.add(porchBottom)


const roofFrontPlank = new THREE.Mesh(
    new THREE.BoxGeometry(0.1,0.1,houseMeasurements.depth / 2),
    basicMaterial
)

roofFrontPlank.position.set(houseMeasurements.width / 2 + porchBottomSizes.width + 0.1,houseMeasurements.height, houseMeasurements.depth/4)

roofGroup.add(roofFrontPlank)


//Porch Columns
const columnSizes = {
    width: 0.125,
    height: houseMeasurements.height,
    depth: 0.125
}

let columnGeometry = new THREE.BoxGeometry(columnSizes.width, columnSizes.height - porchBottomSizes.height, columnSizes.depth)
//Changes initial position of geometry
columnGeometry.translate(
    (houseMeasurements.width / 2 + porchBottomSizes.width - columnSizes.width / 2), //X
    (columnSizes.height / 2 + porchBottomSizes.height / 2) ,//Y
    (porchBottomSizes.depth - columnSizes.depth / 2)) // Z

const columns = [
                        new THREE.Mesh(columnGeometry, basicMaterial),
                        new THREE.Mesh(columnGeometry, basicMaterial),
                        new THREE.Mesh(columnGeometry, basicMaterial),
]

columns[0].castShadow = true
columns[1].castShadow = true
columns[2].castShadow = true

columns[1].position.z -= porchBottomSizes.depth - columnSizes.depth
columns[2].position.z -= porchBottomSizes.depth / 1.65 - columnSizes.depth

porchGroup.add(columns[0], columns[1], columns[2])



//Small Planks

const planksSizesA = {
    width: porchBottomSizes.width,
    height: 0.1,
    depth: 0.1
}

const planksSizesB = {
    width: 0.1,
    height: 0.1,
    depth: porchBottomSizes.depth / 1.75
}

const planksSizesC = {
    width: 0.07,
    height: columnSizes.height / 3 + porchBottomSizes.height / 2,
    depth: 0.07,
    leftSideCount: 3
}

let plankGeometryA = new THREE.BoxGeometry(planksSizesA.width, planksSizesA.height, planksSizesA.depth)
let plankGeometryB = new THREE.BoxGeometry(planksSizesB.width, planksSizesB.height, planksSizesB.depth)
let plankGeometryC = new THREE.BoxGeometry(planksSizesC.width, planksSizesC.height, planksSizesC.depth)

plankGeometryA.translate(
    (houseMeasurements.width / 2 + porchBottomSizes.width - planksSizesA.width / 2), //X
    (columnSizes.height / 3 + porchBottomSizes.height / 2) ,//Y
    (porchBottomSizes.depth - planksSizesA.depth / 2)) // Z

plankGeometryB.translate(
    (houseMeasurements.width / 2 + porchBottomSizes.width - planksSizesB.width / 2), //X
    (columnSizes.height / 3 + porchBottomSizes.height / 2) ,//Y
    (porchBottomSizes.depth - planksSizesB.depth / 2)) // Z

const planksA = [
    new THREE.Mesh(plankGeometryA, basicMaterial),
    new THREE.Mesh(plankGeometryA, basicMaterial)
]

const plankB = new THREE.Mesh(plankGeometryB, basicMaterial)

plankGeometryC.translate(
    (houseMeasurements.width / 2 + porchBottomSizes.width / 4.5), //X
    (columnSizes.height / 3 + porchBottomSizes.height / 2 - planksSizesC.height / 2) ,//Y
    (porchBottomSizes.depth - planksSizesC.depth / 2)) // Z

for (let i = 0; i < planksSizesC.leftSideCount; i++) {
    let tempPlank = new THREE.Mesh(plankGeometryC, basicMaterial)
    tempPlank.position.x += porchBottomSizes.width / 4.5 * i
    porchGroup.add(tempPlank)
}

for (let i = 0; i < planksSizesC.leftSideCount; i++) {
    let tempPlank = new THREE.Mesh(plankGeometryC, basicMaterial)
    tempPlank.position.z -= porchBottomSizes.depth - planksSizesC.depth
    tempPlank.position.x += porchBottomSizes.width / 4.5 *i
    porchGroup.add(tempPlank)
}

const plankGroup = new THREE.Group()
plankGroup.position.z -= porchBottomSizes.depth / 12
for (let i = 0; i < planksSizesC.leftSideCount * 2; i++) {
    let tempPlank = new THREE.Mesh(plankGeometryC, basicMaterial)
    tempPlank.position.z -= porchBottomSizes.depth / 12 * i
    tempPlank.position.x += 0.73
    plankGroup.add(tempPlank)
}
porchGroup.add(plankGroup)


planksA[0].castShadow = true
planksA[1].castShadow = true
plankB.castShadow = true

planksA[1].position.z -= porchBottomSizes.depth - planksSizesA.depth

porchGroup.add(planksA[0], planksA[1], plankB)


//Steps near porch
//columns[2].position.z -= porchBottomSizes.depth / 1.65 - columnSizes.depth

const stepSizes = {
    widthA: 0.3,
    heightA: 0.15,
    depthA: porchBottomSizes.depth - porchBottomSizes.depth / 1.65,
}

const stepA = new THREE.Mesh(
    new THREE.BoxGeometry(stepSizes.widthA, stepSizes.heightA, stepSizes.depthA),
    basicMaterial
)
stepA.geometry.translate(
    houseMeasurements.width / 2 + stepSizes.widthA / 2 + porchBottomSizes.width,
    stepSizes.heightA / 2,
    stepSizes.depthA / 2 + columnSizes.depth / 2
)

const stepB = new THREE.Mesh(
    new THREE.BoxGeometry(stepSizes.heightA, stepSizes.heightA, stepSizes.depthA),
    basicMaterial
)
stepB.geometry.translate(
    houseMeasurements.width / 2 + stepSizes.heightA / 2 + porchBottomSizes.width,
    stepSizes.heightA * 1.5,
    stepSizes.depthA / 2 + columnSizes.depth / 2
)

//stepA.geometry.translate(2, 2, 2) //Moves Origin (new 0 0 0 for the object)
//stepA.position.set(0,0,0) //Moves position relative to its origin

porchGroup.add(stepA, stepB)


//Door
const doorSizes = {
    width: 0.02,
    height: houseMeasurements.height / 1.35,
    depth: 0.9
}

const doorTexture = textureLoader.load('/hauntedhouse/Door_01_White.png')
doorTexture.colorSpace = THREE.SRGBColorSpace
doorTexture.minFilter = THREE.NearestFilter
doorTexture.magFilter = THREE.NearestFilter
doorTexture.wrapS = THREE.RepeatWrapping
doorTexture.wrapT = THREE.RepeatWrapping
const doorNormalTexture = textureLoader.load('/hauntedhouse/door-normal.png')
doorTexture.colorSpace = THREE.SRGBColorSpace
doorTexture.minFilter = THREE.NearestFilter
doorTexture.magFilter = THREE.NearestFilter
const doorRoughnessTexture = textureLoader.load('/hauntedhouse/doorRoughness.jpg')

const doorMaterial = new THREE.MeshStandardMaterial({
                                                    map: doorTexture,
                                                    normalMap: doorNormalTexture,
                                                    roughness: 1,
                                                    roughnessMap: doorRoughnessTexture
})

const doorMesh = new THREE.Mesh(
    new THREE.BoxGeometry(doorSizes.width, doorSizes.height, doorSizes.depth),
    doorMaterial
)

doorMesh.receiveShadow = false

doorMesh.geometry.translate(
    houseMeasurements.width / 2 + doorSizes.width / 4,
    doorSizes.height / 2 + porchBottomSizes.height,
    doorSizes.depth / 2 + columnSizes.depth * 2,
)

porchGroup.add(doorMesh)


//Bench

const benchSizes = {
    baseDepth: porchBottomSizes.depth / 2,
    baseHeight: 0.065,
    baseWidth: 0.3,
    baseWidthOffset: 0.05,
    baseDepthOffset: 0.2,
    legHeight: 0.2,
    legWidth: 0.3,
    legDepth: 0.05,
    legOffset: 0.05,
}

const benchGroup = new THREE.Group()
scene.add(benchGroup)

const benchBaseMesh = new THREE.Mesh(
    new THREE.BoxGeometry(benchSizes.baseWidth, benchSizes.baseHeight, benchSizes.baseDepth),
    basicMaterial
) 

benchBaseMesh.geometry.translate(
    houseMeasurements.width / 2 + benchSizes.baseWidth / 2 + benchSizes.baseWidthOffset,
    porchBottomSizes.height + benchSizes.legHeight,
    porchBottomSizes.depth - benchSizes.baseDepth / 2 - benchSizes.baseDepthOffset
)

benchGroup.add(benchBaseMesh)

const benchLegGeometry = new THREE.BoxGeometry(benchSizes.legWidth, benchSizes.legHeight, benchSizes.legDepth)

benchLegGeometry.translate(
    houseMeasurements.width / 2 + benchSizes.baseWidth / 2 + benchSizes.baseWidthOffset,
    porchBottomSizes.height + benchSizes.legHeight / 2,
    porchBottomSizes.depth - benchSizes.legDepth / 2 - benchSizes.baseDepthOffset - benchSizes.legOffset
)

const benchLegs = [
    new THREE.Mesh(benchLegGeometry, basicMaterial),
    new THREE.Mesh(benchLegGeometry, basicMaterial)
]

benchLegs[1].position.z -= benchSizes.baseDepth - benchSizes.legDepth - benchSizes.legOffset * 2

benchGroup.add(benchLegs[0], benchLegs[1])


const windowSizes = {
    width: 0.02,
    height: houseMeasurements.height / 2,
    depth: 0.6
}

const windowTexture = textureLoader.load('/hauntedhouse/window.jpg')
const windowRoughnessTexture = textureLoader.load('/hauntedhouse/windowRoughness.jpg')
const windowsNormalTexture = textureLoader.load('/hauntedhouse/windowNormal.png')
windowTexture.colorSpace = THREE.SRGBColorSpace

const windowMaterial = new THREE.MeshStandardMaterial({
    map: windowTexture,
    roughness: 1,
    roughnessMap: windowRoughnessTexture,
    normalMap: windowsNormalTexture
})

const windowGeometry = new THREE.BoxGeometry(windowSizes.width, windowSizes.height, windowSizes.depth)
const windows = [
                    new THREE.Mesh(windowGeometry, windowMaterial),
                    new THREE.Mesh(windowGeometry, windowMaterial),
                    new THREE.Mesh(windowGeometry, windowMaterial),
                    new THREE.Mesh(windowGeometry, windowMaterial)
]

windowGeometry.translate(
    houseMeasurements.width / 2 - windowSizes.width / 4,
    windowSizes.height + porchBottomSizes.height,
    houseMeasurements.width - windowSizes.depth,
)

windows[1].position.z -= windowSizes.depth + windowSizes.depth / 3

windows[2].position.x -= houseMeasurements.width
windows[3].position.x -= houseMeasurements.width

windows[2].position.z -= windowSizes.depth
windows[3].position.z -= houseMeasurements.depth - windowSizes.depth * 3

porchGroup.add(windows[0], windows[1], windows[2], windows[3])



const roofWindowTexture = textureLoader.load('/hauntedhouse/roofWindow.jpg')
const roofWindowRoughnessTexture = textureLoader.load('/hauntedhouse/roofWindowRoughness.jpg')
const roofWindowNormalTexture = textureLoader.load('/hauntedhouse/roofWindowNormal.png')
roofWindowTexture.colorSpace = THREE.SRGBColorSpace

const roofWindowMaterial = new THREE.MeshStandardMaterial({
    map: roofWindowTexture,
    roughness: 1,
    roughnessMap: roofWindowRoughnessTexture,
    normalMap: roofWindowNormalTexture
})


const roofWindow = new THREE.Mesh(
    new THREE.BoxGeometry(0.025,0.5,0.5),
    roofWindowMaterial
)

roofWindow.position.set(houseMeasurements.width / 2 + porchBottomSizes.width + 0.1,houseMeasurements.height + roofMeasurements.height/2 - 0.1, houseMeasurements.depth/4)

roofGroup.add(roofWindow)



//Attic
const atticTexture = textureLoader.load('/hauntedhouse/test.jpg')
atticTexture.colorSpace = THREE.SRGBColorSpace

const atticNormalTexture = textureLoader.load('/hauntedhouse/testnormal.png')
const atticAlphaTexture = textureLoader.load('/hauntedhouse/testAlpha.jpg')

const atticMaterial = new THREE.MeshStandardMaterial({ 
                                                        map: atticTexture,
                                                        normalMap: atticNormalTexture,
                                                        roughness: 1,
                                                        roughnessMap: atticAlphaTexture,
                                                    })

const atticSizes = {
    width: 1,
    height: 0.9,
    depth: 1.3
}

const atticMesh = new THREE.Mesh(
    new THREE.BoxGeometry(atticSizes.width, atticSizes.height, atticSizes.depth),
    [atticMaterial, basicMaterial, basicMaterial, basicMaterial, basicMaterial, basicMaterial]
)

atticMesh.geometry.translate(houseMeasurements.width / 4,atticSizes.height/2 + houseMeasurements.height - 0.02,-houseMeasurements.width / 2)

roofGroup.add(atticMesh)


const atticRoofMesh = new THREE.Mesh(
    new THREE.BoxGeometry(atticSizes.width + 0.2, atticSizes.height / 15, atticSizes.depth + 0.2),
    roofMeshMaterial
)
atticRoofMesh.rotateZ(-0.1)
atticRoofMesh.position.set(houseMeasurements.width / 4,atticSizes.height + houseMeasurements.height,-houseMeasurements.width / 2)


roofGroup.add(atticRoofMesh)



//Garage
const garageGroup = new THREE.Group()
scene.add(garageGroup)

const garageSizes = {
    width: 0.025,
    height: houseMeasurements.height / 1.2,
    depth: houseMeasurements.depth / 3
}

const garageTexture = textureLoader.load('/hauntedhouse/garage.jpg')
garageTexture.colorSpace = THREE.SRGBColorSpace
const garageNormalTexture = textureLoader.load('/hauntedhouse/garageNormal.png')


const garageMaterial = new THREE.MeshPhongMaterial({
                                                        map: garageTexture,
                                                        normalMap: garageNormalTexture
})

const garageBase = new THREE.Mesh(
    new THREE.BoxGeometry(garageSizes.width, garageSizes.height, garageSizes.depth),
    garageMaterial
)

garageBase.position.set(houseMeasurements.width / 2 + garageSizes.width / 2,garageSizes.height / 2, (-houseMeasurements.depth / 2 + garageSizes.depth)-((houseMeasurements.depth / 2 - garageSizes.depth) / 2))

garageGroup.add(garageBase)



const garageRoof = new THREE.Mesh(
    new THREE.BoxGeometry(1, garageSizes.width, garageSizes.depth + 0.5 ),
    roofMeshMaterial
)

garageRoof.position.set(houseMeasurements.width / 2 + garageSizes.width / 2, garageSizes.height + 0.2, (-houseMeasurements.depth / 2 + garageSizes.depth)-((houseMeasurements.depth / 2 - garageSizes.depth) / 2))

garageRoof.rotateZ(-0.75)

garageGroup.add(garageRoof)


const garageRoofColumnGeometry = new THREE.BoxGeometry(0.075, houseMeasurements.height / 4, 0.075)



const garageRoofColumns = [
    new THREE.Mesh(garageRoofColumnGeometry, basicMaterial),
    new THREE.Mesh(garageRoofColumnGeometry, basicMaterial)
]

garageRoofColumns[0].rotateZ(-0.75)
garageRoofColumns[1].rotateZ(-0.75)

garageRoofColumns[0].position.set(houseMeasurements.width / 1.9, houseMeasurements.height / 1.4,  -0.4)
garageRoofColumns[1].position.set(houseMeasurements.width / 1.9, houseMeasurements.height / 1.4,  -0.6 - garageSizes.depth)

garageGroup.add(garageRoofColumns[0], garageRoofColumns[1])

//Trees
const treeTexture = textureLoader.load('/hauntedhouse/tree.jpg')
treeTexture.colorSpace = THREE.SRGBColorSpace
treeTexture.minFilter = THREE.NearestFilter
treeTexture.magFilter = THREE.NearestFilter
const treeAlphaTexture = textureLoader.load('/hauntedhouse/treeAlpha.jpg')


const treeMaterial = new THREE.MeshPhongMaterial({
                                                        map: treeTexture,
                                                        alphaMap: treeAlphaTexture,
                                                        transparent: true,
                                                        alphaTest: 0.5,
                                                        side: THREE.DoubleSide
})

const treeSizes = {
    scale: 5,
    instanceCount: 2000
}

const treePlaneGeometry = new THREE.PlaneGeometry(treeSizes.scale,treeSizes.scale)
const treeInstancedMesh = new THREE.InstancedMesh(treePlaneGeometry,treeMaterial, treeSizes.instanceCount)
treeInstancedMesh.position.y += treeSizes.scale / 2


const treePositionMatrix = new THREE.Matrix4()

for (let i = 0; i < treeSizes.instanceCount; i++) {

    let angle = Math.random() * Math.PI * 2
    let radius = 12 + Math.random() * 100
    let x = Math.sin(angle) * radius
    let z = Math.cos(angle) * radius

    treePositionMatrix.makeRotationY(angle)
    treePositionMatrix.setPosition(x, 0, z)

    //grassBladeMesh.rotation.y = angle
    
    treeInstancedMesh.setMatrixAt(i, treePositionMatrix)
}


scene.add(treeInstancedMesh)


//Point Light
const pointLight = new THREE.PointLight(0xffffff, 12, 8, 0)
const pointLightA = new THREE.PointLight(0xffffff, 12, 8, 0)
pointLight.position.set(-10, 6, 10)
pointLight.castShadow = true
pointLightA.castShadow = true

scene.add(pointLight, pointLightA)

//Directional Light
const directional = new THREE.DirectionalLight(0xC1C7D6, 1)
directional.position.set(160,40,30)
directional.castShadow = true
scene.add(directional)

//Ambient Light
const ambient = new THREE.AmbientLight(0xDCE1ED, 0.3)
scene.add(ambient)

//Ambient Light
const spotLight = new THREE.SpotLight(0xDCE1ED, 10, 10, Math.PI * 0.5, 0, 1)
spotLight.position.set( 0, 8, 0 )

scene.add(spotLight)





//Composer Effects (Post Processing)/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const composer = new EffectComposer( renderer )
const renderPixelatedPass = new RenderPixelatedPass( 6, scene, camera )
composer.addPass( renderPixelatedPass )

renderPixelatedPass.normalEdgeStrength = 0 //Edge Outlining
renderPixelatedPass.depthEdgeStrength = 0 //Edge Outlining




const outputPass = new OutputPass()
composer.addPass( outputPass )

const pixelPassParams = {
    pixelSize: 6,
}

tweaks.addBinding(pixelPassParams, 'pixelSize', {
                                                        min: 1,
                                                        max: 10,
                                                        step: 1
                                                    })
                                                        .on('change', (ev) => {
                                                            renderPixelatedPass.setPixelSize(pixelPassParams.pixelSize)
                                                    })





//Animation Loop Function//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let cameraSettings = {
    cameraSpeed: 12,
    cameraZoom: 12,
    enableAnimation: true
}

tweaks.addBinding(cameraSettings, 'cameraSpeed', {
                                                        min: 1,
                                                        max: 16,
                                                        step: 0.5
})
tweaks.addBinding(cameraSettings, 'cameraZoom', {
                                                        min: 6,
                                                        max: 16,
                                                        step: 1
})
tweaks.addBinding(cameraSettings, 'enableAnimation')
const tick = () => {

    const elapsedTime = clock.getElapsedTime() //Built in function in seconds since start

    pointLight.position.x = Math.sin(elapsedTime) * 2
    pointLight.position.z = Math.cos(elapsedTime) * 2
    pointLightA.position.x = Math.sin(elapsedTime) * 15
    pointLightA.position.z = Math.cos(elapsedTime) * 15

    camera.lookAt(new THREE.Vector3()) //Empty Vector3 method resul in 0 0 0  Vector, basically center of the scene

    if (cameraSettings.enableAnimation == true) {
        camera.position.x = Math.sin(elapsedTime / cameraSettings.cameraSpeed ) * cameraSettings.cameraZoom
        camera.position.z = Math.cos(elapsedTime / cameraSettings.cameraSpeed) * cameraSettings.cameraZoom
    }
    

    //Render Function
    //renderer.render(scene, camera) //by default all objects will appear at center of the scene in 0 0 0 coordinates, meaning camera will be at the center too
    composer.render()
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
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix() // Update Camera

    renderer.setSize(sizes.width, sizes.height) //Update Renderer - Better put here so user when moving windows from screen to screen would recieve better expirience

})
