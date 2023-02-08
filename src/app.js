import * as THREE from 'three';
import { EXRLoader } from '../node_modules/three/examples/jsm/loaders/EXRLoader.js';
import { PMREMGenerator } from '../node_modules/three/src/extras/PMREMGenerator.js';
import { OrbitControls } from 'orbitControls';

let matRadios = document.querySelectorAll('input[name="material"]');
for (let i = 0; i < matRadios.length; i++) {
    matRadios[i].addEventListener(
        "change", function() {switchMaterial(this.value)}
    );
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth /
                                           window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer();
const pmremGenerator = new PMREMGenerator(renderer);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
pmremGenerator.compileEquirectangularShader();

const geometry = new THREE.BoxGeometry(1, 1, 1);

const stoneTex = new THREE.Texture(genNoiseBumpMap());
stoneTex.needsUpdate = true;
const stoneMat = new THREE.MeshStandardMaterial({color: 0x302020, bumpMap: stoneTex, bumpScale: 0.1});

let exrTex = await new EXRLoader().loadAsync('clarens_midday_1k.exr')
let metEnvMap = pmremGenerator.fromEquirectangular(exrTex).texture
metEnvMap.needsUpdate = true;
const metalMat = new THREE.MeshStandardMaterial({color: 0xFFFFFF, metalness: 1,
                                                 envMap: metEnvMap, envMapIntensity: 0.8,
                                                 roughness: 0.1});

const ambLight = new THREE.AmbientLight(0x808080);
const spotlightl = new THREE.SpotLight(0xffffff);
spotlightl.position.set(-60, 10, 10);
spotlightl.castShadow = true;
const spotlightr = new THREE.SpotLight(0xffffff);
spotlightr.position.set(60, 10, -10);
spotlightr.castShadow = true;

const cube = new THREE.Mesh(geometry, metalMat);
scene.add(cube);
scene.add(spotlightl);
scene.add(spotlightr);
scene.add(ambLight);
camera.position.z = 5;

function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
}

function switchMaterial(value) {
    switch (value) {
        case "metal":
            cube.material = metalMat;
            break;
        case "stone":
            cube.material = stoneMat;
            break;
        default:
            break;
    }
}

function genNoiseBumpMap() {
    let canvas = document.createElement("canvas");
    canvas.width = canvas.height = 200;
    const ctx = canvas.getContext('2d');
    for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
            let value = Math.floor((Math.random() * 128) + 64);
            ctx.fillStyle = "rgba(" + value + "," + value + "," + value + ",1)";
            ctx.fillRect(x, y, 1, 1);
        }
    }
    return canvas;
}
animate();

