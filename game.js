import * as THREE from 'three';

// --- SCÉNA ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- SVĚTLA ---
scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

// --- TEXTURY ---
const textureLoader = new THREE.TextureLoader();
const moonTexture = textureLoader.load('mesic.jpg');
moonTexture.wrapS = moonTexture.wrapT = THREE.RepeatWrapping;
moonTexture.repeat.set(10, 10);
scene.add(new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ map: moonTexture })));

// --- HRÁČ ---
const playerTexture = textureLoader.load('panacek_krok.png');
playerTexture.repeat.set(1 / 4, 1);
const player = new THREE.Sprite(new THREE.SpriteMaterial({ map: playerTexture }));
player.scale.set(2, 2, 1);
const vychoziVyska = 1;
player.position.y = vychoziVyska;
scene.add(player);

// --- PLASTY ---
const plasticTexture = textureLoader.load('plast.png');
let plastics = [];
for (let i = 0; i < 15; i++) {
    const p = new THREE.Sprite(new THREE.SpriteMaterial({ map: plasticTexture }));
    p.scale.set(0.6, 0.6, 1);
    p.position.set((Math.random() - 0.5) * 40, 0.5, (Math.random() - 0.5) * 40);
    scene.add(p);
    plastics.push(p);
}

// --- OVLÁDÁNÍ ---
const keys = { w: false, a: false, s: false, d: false };
window.addEventListener('keydown', (e) => { if(keys.hasOwnProperty(e.key)) keys[e.key] = true; });
window.addEventListener('keyup', (e) => { if(keys.hasOwnProperty(e.key)) keys[e.key] = false; });

const joystick = window.nipplejs.create({ zone: document.getElementById('joystick-zone'), mode: 'static', position: { left: '50%', top: '50%' }, size: 100 });
let joystickVector = { x: 0, y: 0 };
joystick.on('move', (e, d) => { joystickVector.x = Math.cos(d.angle.radian) * (d.distance/50); joystickVector.y = Math.sin(d.angle.radian) * (d.distance/50); });
joystick.on('end', () => joystickVector = { x: 0, y: 0 });

// --- ANIMACE ---
const clock = new THREE.Clock();
let plastCount = 0;
let casRadosti = 0;
let aktualniSnimek = 0;

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    let hybeSe = false;

    // Pohyb a Otáčení (přes rotation.y)
    if (keys.a || joystickVector.x < 0) { 
        player.position.x -= 0.15; 
        player.rotation.y = Math.PI; // Otočení o 180 stupňů
        hybeSe = true; 
    } else if (keys.d || joystickVector.x > 0) { 
        player.position.x += 0.15; 
        player.rotation.y = 0;       // Reset otočení
        hybeSe = true; 
    }
    if (keys.w || joystickVector.y > 0) { player.position.z -= 0.15; hybeSe = true; }
    if (keys.s || joystickVector.y < 0) { player.position.z += 0.15; hybeSe = true; }

    // Sprite Animace
    if (hybeSe) {
        aktualniSnimek += 10 * delta;
        playerTexture.offset.x = (Math.floor(aktualniSnimek) % 4) / 4;
    }

    // Radost
    if (casRadosti > 0) {
        casRadosti -= delta;
        player.position.y = vychoziVyska + Math.sin((1 - (casRadosti / 0.4)) * Math.PI) * 0.8;
    } else {
        player.position.y = vychoziVyska;
    }

    // Kolize
    plastics.forEach((p, i) => {
        if (player.position.distanceTo(p.position) < 1.5) {
            scene.remove(p);
            plastics.splice(i, 1);
            plastCount++;
            document.getElementById('plast-count').innerText = plastCount;
            casRadosti = 0.4;
            if (plastCount >= 10) document.getElementById('status').innerText = "Vše uklizeno! Neopren hotov.";
        }
    });

    camera.position.set(player.position.x, player.position.y + 10, player.position.z + 10);
    camera.lookAt(player.position);
    renderer.render(scene, camera);
}
animate();