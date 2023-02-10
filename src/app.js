import * as THREE from 'three';
import { EXRLoader } from '../node_modules/three/examples/jsm/loaders/EXRLoader.js';
import { PMREMGenerator } from '../node_modules/three/src/extras/PMREMGenerator.js';
import { OrbitControls } from 'orbitControls';
import { createNoise2D } from 'simplex-noise';
import * as Ammo from './ammo.js';

Ammo().then(Start);

function Start() {
}

let physicsWorld = undefined;
const rigidBody_list = new Array();
let tmpTransformation = new Ammo.btTransform();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth /
                                           window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer();
const pmremGenerator = new PMREMGenerator(renderer);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);
pmremGenerator.compileEquirectangularShader();

const geometry = new THREE.BoxGeometry(1, 1, 1);
const planegeo = new THREE.PlaneGeometry(8, 8);

const stoneTex = new THREE.Texture(genNoiseBumpMap());
stoneTex.needsUpdate = true;
const stoneMat = new THREE.MeshStandardMaterial({color: 0x302020, bumpMap: stoneTex, bumpScale: 0.1});

let exrTex = await new EXRLoader().loadAsync('clarens_midday_1k.exr')
let metEnvMap = pmremGenerator.fromEquirectangular(exrTex).texture
metEnvMap.needsUpdate = true;
const metalMat = new THREE.MeshStandardMaterial({color: 0xF0F0F0, metalness: 1,
                                                 envMap: metEnvMap, envMapIntensity: 0.8,
                                                 roughness: 0.1});

const radMat = new THREE.MeshStandardMaterial({color: 0x40B000, emissive: 0x00FF00})
radMat.needsUpdate = true;

//Not working as envisioned, needs tweaking or scrapping
const terrainMap = genSimplexMap();
const terrainBumpMap = genTerrainBumpMap(terrainMap);
const earthMap = new THREE.Texture(terrainMap);
earthMap.needsUpdate = true;
const earthBumpMap = new THREE.Texture(terrainBumpMap);
earthBumpMap.needsUpdate = true;
const earthMat = new THREE.MeshStandardMaterial({map: earthMap, bumpMap: earthBumpMap, bumpScale: 1});
earthMat.needsUpdate = true;

const floorMat = new THREE.MeshStandardMaterial({color: 0xE0E0E0, roughness: 0.3});
floorMat.needsUpdate = true;

const cube = new THREE.Mesh(geometry, stoneMat);
cube.castShadows = true;
const floor = new THREE.Mesh(planegeo, floorMat);
floor.receiveShadows = true;
floor.rotation.x = -1;
floor.position.y = -1;

const ambLight = new THREE.AmbientLight(0x101010);
const pointLight = new THREE.PointLight(0x808080);
pointLight.position.set(0, 100, -10);
pointLight.castShadow = true;
const spotLight = new THREE.SpotLight(0xFFFFFF);
spotLight.position.set(0, 160, -80);
spotLight.castShadow = true;
spotLight.target = cube;
spotLight.target.updateMatrixWorld();

let transform = new Ammo.btTransform();
transform.setIdentity();
transform.setOrigin(new Ammo.btVector(0, 0, 0));
transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));
let defaultMotionState = new Ammo.btDefaultMotionState(transform);
let structColShape = new Ammo.btBoxShape( new Ammo.btVector3(1, 1, 1) );
structColShape.setMargin( 0.05 );
let localInertia = new Ammo.btVector3(0, 0, 0);
structColShape.CalculateLocalInertia(10, localInertia);
let rBody_Info = new Ammo.btRigidBodyconstructionInfo(mass, 
    defaultMotionState, structColShape, localInertia
);
let rBody = new Ammo.btRigidBody(RBody_Info);
physicsWorld.addRigidBody(rBody);
cube.userdata.physicsBody = rBody;
rigidBody_List.push(cube);

scene.add(cube);
scene.add(floor);
scene.add(spotLight);
scene.add(spotLight.target);
scene.add(pointLight);
scene.add(ambLight);
camera.position.z = 5;

function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
}

function setupPhysicsWorld() {
    let collisionConfiguration = new Ammo.btDefaulCollisionConfiguration();
    let dispatcher = new Ammo.btCollisionDispatcher();
    let overlappingPairCache = new Ammo.btDbvtBroadphase();
    let solver = new Ammo.btSequentialImpulseConstraintSolver();
    let physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, 
        overlappingPairCache, solver, collisionConfiguration
    );
    physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));
}

function updatePhysicsWorld(deltaTime) {
    physicsWorld.stepSimulation(deltaTime, 10);
    let motionState = cube.userData.physicsBody.getMotionState();
    if (motionState) {
        motionState.getWorldTransform(tmpTransformation);
        let newPos = tmpTransformation.getOrigin();
        let newQua = tmpTransformation.getRotation();
        cube.position.set(newPos.x(), newPos.y(), newPos.z());
        cube.quaternion.set(newQua.x(), newQua.y(), newQuaz());
    }
}

function addEventListeners() {
    let matRadios = document.querySelectorAll('input[name="material"]');
    for (let i = 0; i < matRadios.length; i++) {
        matRadios[i].addEventListener(
            "change", function() {switchMaterial(this.value)}
        );
    }
    let sizeRanges = document.querySelectorAll('input[name="size"]');
    for (let j = 0; j < sizeRanges.length; j++) {
        console.log("event", j);
        sizeRanges[j].addEventListener(
            "change", function() {resizeCube(this.id, this.value)}
        );
    }
    document.getElementById('resetBtn').addEventListener("click", resetScene);
}

function resetScene() {
    cube.material = stoneMat;
    cube.scale.x = cube.scale.y = cube.scale.z = 1;

    let matRadios = document.querySelectorAll('input[name="material"]');
    for (let i = 0; i < matRadios.length; i++) {
        if (matRadios[i].id == "stone") {
            matRadios[i].checked = true;
        } else {
            matRadios[i].checked = false;
        }
    }
    let sizeRanges = document.querySelectorAll('input[name="size"]');
    for (let j = 0; j < sizeRanges.length; j++) {
        sizeRanges[j].value="1";
    }
}



function switchMaterial(value) {
    switch (value) {
        case "metal":
            cube.material = metalMat;
            break;
        case "stone":
            cube.material = stoneMat;
            break;
        case "radioactive":
            cube.material = radMat;
            break;
        case "earth":
            cube.material = earthMat;
            break;
        default:
            break;
    }
    cube.needsUpdate = true;
}

function resizeCube(axis, value) {
    switch (axis) {
        case "sizex":
            cube.scale.x = value;
            break;
        case "sizey":
            cube.scale.y = value;
            break;
        case "sizez":
            cube.scale.z = value;
            break;
        default:
            break;
    }
    cube.needsUpdate = true;
}

function genNoiseBumpMap() {
    let canvas = document.createElement("canvas");
    canvas.width = canvas.height = 200;
    const ctx = canvas.getContext('2d');
    for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
            let value = Math.floor((Math.random() * 128) + 64);
            ctx.fillStyle = "rgb(" + value + "," + value + "," + value + ")";
            ctx.fillRect(x, y, 1, 1);
        }
    }
    return canvas;
}

function genSimplexMap() {
    let canvas = document.createElement("canvas");
    canvas.width = canvas.height = 40;
    const ctx = canvas.getContext('2d');
    const noise2d = createNoise2D();
    for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
            let value = Math.floor((noise2d(x, y) + 1) * 127);
            //let value = Math.floor(Math.random() * 255);
            if (value < 150) {
                ctx.fillStyle = "rgb(0,0,127)";
            } else {
                ctx.fillStyle = "rgb(40," + value + ",0)";
            }
            ctx.fillRect(x, y, 1, 1);
        }
    }
    return canvas;
}

function genTerrainBumpMap(simplexCanvas) {
    let canvas = document.createElement("canvas");
    canvas.width = canvas.height = 40;
    const ctx = canvas.getContext('2d');
    const simplex = simplexCanvas.getContext('2d');
    for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
            let sourcePx = simplex.getImageData(x, y, 1, 1)
            if (sourcePx.data[2] > 0) {
                ctx.fillStyle = "rgb(0,0,0)";
            } else {
                let value = sourcePx.data[1];
                ctx.fillstyle = "rgb(" + value + "," + value + "," + value + ")";
            }
            ctx.fillRect(x, y, 1, 1);
        }
    }
    return canvas;
}

animate();

