import * as THREE from 'three';
import { OrbitControls } from 'orbitControls';
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth /
                                           window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({color: 0x00ff00});
const material2 = new THREE.MeshStandardMaterial({color: 0x302020});
const stoneTex = new THREE.Texture(genNoiseBumpMap());
stoneTex.needsUpdate = true;
const stoneMat = new THREE.MeshStandardMaterial({color: 0x302020, bumpMap: stoneTex, bumpScale: 0.1});
const spotlightl = new THREE.SpotLight(0xffffff);
spotlightl.position.set(-60, 20, 10);
spotlightl.castShadow = true;
const spotlightr = new THREE.SpotLight(0xffffff);
spotlightr.position.set(60, 20, 10);
spotlightr.castShadow = true;

const cube = new THREE.Mesh(geometry, stoneMat);
scene.add(cube);
scene.add(spotlightl);
scene.add(spotlightr);
camera.position.z = 5;

function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
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

