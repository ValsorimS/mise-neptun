import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 10);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

const textureLoader = new THREE.TextureLoader();

// Podlaha
const moonTexture = textureLoader.load('mesic.jpg');
moonTexture.wrapS = THREE.RepeatWrapping;
moonTexture.wrapT = THREE.RepeatWrapping;
moonTexture.repeat.set(10, 10); 
const floorMaterial = new THREE.MeshStandardMaterial({ map: moonTexture, color: 0xaaaaaa });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Hráč
const playerTexture = textureLoader.load('panacek_krok.png'); 
const pocetSnimku = 4;
playerTexture.repeat.set(1 / pocetSnimku, 1);
const player = new THREE.Sprite(new THREE.SpriteMaterial({ map: playerTexture }));
player.scale.set(2, 2, 1); 
const vychoziVyska = 1;
player.position.y = vychoziVyska;     
scene.add(player);

const clock = new THREE.Clock();
let aktualniSnimek = 0;

// Plasty
const plasticTexture = textureLoader.load('plast.png');
const plastics = [];
for (let i = 0; i < 15; i++) {
    const plastic = new THREE.Sprite(new THREE.SpriteMaterial({ map: plasticTexture }));
    plastic.scale.set(0.6, 0.6, 1); 
    plastic.position.set((Math.random() - 0.5) * 40, 0.5, (Math.random() - 0.5) * 40);
    scene.add(plastic);
    plastics.push(plastic);
}

// Ovládání
const keys = { w: false, a: false, s: false, d: false };
window.addEventListener('keydown', (e) => { if(keys.hasOwnProperty(e.key)) keys[e.key] = true; });
window.addEventListener('keyup', (e) => { if(keys.hasOwnProperty(e.key)) keys[e.key] = false; });

const joystickManager = window.nipplejs.create({ zone: document.getElementById('joystick-zone'), mode: 'static', position: { left: '50%', top: '50%' }, color: 'white', size: 100 });
let joystickVector = { x: 0, y: 0 };
joystickManager.on('move', (evt, data) => { joystickVector.x = Math.cos(data.angle.radian) * (data.distance / 50); joystickVector.y = Math.sin(data.angle.radian) * (data.distance / 50); });
joystickManager.on('end', () => joystickVector = { x: 0, y: 0 });

const speed = 0.15;
let plastCount = 0;
let casRadosti = 0;

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    let hracSeHybe = false;

    if (keys.w) { player.position.z -= speed; hracSeHybe = true; }
    if (keys.s) { player.position.z += speed; hracSeHybe = true; }
    if (keys.a) { player.position.x -= speed; hracSeHybe = true; player.scale.x = -2; }
    if (keys.d) { player.position.x += speed; hracSeHybe = true; player.scale.x = 2; }

    if (joystickVector.x !== 0 || joystickVector.y !== 0) {
        player.position.x += joystickVector.x * speed;
        player.position.z -= joystickVector.y * speed; 
        hracSeHybe = true;
        player.scale.x = joystickVector.x < 0 ? -2 : 2;
    }

    if (hracSeHybe) {
        aktualniSnimek += 10 * delta; 
        playerTexture.offset.x = Math.floor(aktualniSnimek) % pocetSnimku / pocetSnimku;
    } else {
        playerTexture.offset.x = 0;
        aktualniSnimek = 0;
    }

    if (casRadosti > 0) {
        casRadosti -= delta;
        player.position.y = vychoziVyska + Math.sin((1 - (casRadosti / 0.4)) * Math.PI) * 0.8;
    } else {
        player.position.y = vychoziVyska;
    }

    camera.position.set(player.position.x, player.position.y + 10, player.position.z + 10);
    camera.lookAt(player.position);

    plastics.forEach((p, i) => {
        if (player.position.distanceTo(p.position) < 1.5) {
            scene.remove(p); plastics.splice(i, 1); plastCount++;
            document.getElementById('plast-count').innerText = plastCount;
            casRadosti = 0.4;
        }
    });

    renderer.render(scene, camera);
}
animate();