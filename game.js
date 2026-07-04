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
dirLight.position.set(0, 20, 10);
scene.add(dirLight);

// --- PODLAHA ---
const textureLoader = new THREE.TextureLoader();
const moonTexture = textureLoader.load('mesic.jpg');
moonTexture.wrapS = moonTexture.wrapT = THREE.RepeatWrapping;
moonTexture.repeat.set(10, 10);
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60), 
    new THREE.MeshStandardMaterial({ map: moonTexture })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
scene.add(floor);

// --- HRÁČ ---
const playerTexture = textureLoader.load('panacek_krok.png');
playerTexture.repeat.set(1 / 4, 1);
const player = new THREE.Sprite(new THREE.SpriteMaterial({ map: playerTexture, transparent: true }));
player.scale.set(2, 2, 1);
const vychoziVyska = 1.0;
player.position.y = vychoziVyska;
scene.add(player);

// --- PLASTY ---
const plasticTexture = textureLoader.load('plast.png');
let plastics = [];
for (let i = 0; i < 15; i++) {
    const p = new THREE.Sprite(new THREE.SpriteMaterial({ map: plasticTexture, transparent: true }));
    p.scale.set(0.6, 0.6, 1);
    p.position.set((Math.random() - 0.5) * 40, 0.5, (Math.random() - 0.5) * 40);
    scene.add(p);
    plastics.push(p);
}

// --- INVENTÁŘ A NÁSTROJE ---
let inventar = { wood: 0, stone: 0, iron: 0, gold: 0, diamond: 0, dirt: 0 };

// Pro testování dáme banánovi do začátku rovnou železný krumpáč, aby mohl rozbít všechno.
// Později si nástroje můžete přepínat.
let aktualniNastroj = { typ: "krumpac", material: "iron" }; 

function muzeTezit(typBloku) {
    if (typBloku === "dirt" && aktualniNastroj.typ === "lopata") return true;
    if (typBloku === "wood" && aktualniNastroj.typ === "sekera") return true;
    
    // Pro krumpáč a jeskynní bloky
    if (aktualniNastroj.typ === "krumpac") {
        if (typBloku === "stone") return true; 
        if (typBloku === "iron" && (aktualniNastroj.material === "stone" || aktualniNastroj.material === "iron" || aktualniNastroj.material === "diamond")) return true;
        if ((typBloku === "gold" || typBloku === "diamond") && (aktualniNastroj.material === "iron" || aktualniNastroj.material === "diamond")) return true;
    }
    
    // Pro testování (aby mohl banán testovat vše): Pokud máš železný krumpáč, sekej i dřevo a hlínu. 
    // Můžete pak smazat, až přidáte přepínání zbraní.
    if (aktualniNastroj.material === "iron") return true; 

    return false;
}

// --- BIOMY A BLOKY ---
const blockMaterials = {
    wood: new THREE.MeshStandardMaterial({ color: 0x8B4513 }),   // Hnědá
    stone: new THREE.MeshStandardMaterial({ color: 0x808080 }),  // Šedá
    iron: new THREE.MeshStandardMaterial({ color: 0xc0c0c0 }),   // Stříbrná
    gold: new THREE.MeshStandardMaterial({ color: 0xffd700 }),   // Zlatá
    diamond: new THREE.MeshStandardMaterial({ color: 0x00ffff }),// Světle modrá
    dirt: new THREE.MeshStandardMaterial({ color: 0x5C4033 })    // Tmavě hnědá
};

let blocks = [];

function pridajBlok(typ, x, z) {
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const mesh = new THREE.Mesh(geometry, blockMaterials[typ]);
    mesh.position.set(x, 0.75, z); // 0.75 je polovina výšky, aby kostka seděla na zemi
    mesh.userData = { typ: typ };  // Uložíme si, co je to za blok
    scene.add(mesh);
    blocks.push(mesh);
}

// Generování biomu: LES (vlevo nahoře mapy)
for(let i = 0; i < 20; i++) {
    pridajBlok("wood", -10 - Math.random() * 15, -10 - Math.random() * 15);
    pridajBlok("dirt", -10 - Math.random() * 15, -10 - Math.random() * 15);
}

// Generování biomu: JESKYNĚ (vpravo dole mapy)
for(let i = 0; i < 30; i++) {
    pridajBlok("stone", 10 + Math.random() * 20, 10 + Math.random() * 20);
}
// Přidání vzácných rud do jeskyně
for(let i = 0; i < 8; i++) pridajBlok("iron", 15 + Math.random() * 15, 15 + Math.random() * 15);
for(let i = 0; i < 4; i++) pridajBlok("gold", 18 + Math.random() * 10, 18 + Math.random() * 10);
for(let i = 0; i < 2; i++) pridajBlok("diamond", 20 + Math.random() * 5, 20 + Math.random() * 5);

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
    let jeVlevo = false;

    // 1. OVLÁDÁNÍ A POHYB
    if (keys.a || joystickVector.x < -0.1) { 
        player.position.x -= 0.15; 
        jeVlevo = true; // Jdeme doleva
        hybeSe = true; 
    } else if (keys.d || joystickVector.x > 0.1) { 
        player.position.x += 0.15; 
        jeVlevo = false; // Jdeme doprava
        hybeSe = true; 
    }
    
    if (keys.w || joystickVector.y > 0.1) { player.position.z -= 0.15; hybeSe = true; }
    if (keys.s || joystickVector.y < -0.1) { player.position.z += 0.15; hybeSe = true; }

    // 2. ANIMACE - OPRAVENÝ VÝBĚR SNÍMKŮ
    if (hybeSe) {
        aktualniSnimek += 10 * delta;
        let frame = Math.floor(aktualniSnimek) % 2; // Střídá 0 a 1
        
        if (jeVlevo) {
            // Teď jdeme doleva, takže chceme snímky 3 a 4 (offset 0.5+)
            playerTexture.offset.x = 0.5 + (frame * 0.25); 
        } else {
            // Jdeme doprava, chceme snímky 1 a 2 (offset 0.0+)
            playerTexture.offset.x = frame * 0.25;
        }
    } else {
        // Stání (první snímek v řadě - kouká doprava)
        playerTexture.offset.x = 0;
    }

    // 3. RADOSTNÝ VÝSKOK (zůstává stejný)
    if (casRadosti > 0) {
        casRadosti -= delta;
        player.position.y = vychoziVyska + Math.sin((1 - (casRadosti / 0.4)) * Math.PI) * 0.8;
    } else {
        player.position.y = vychoziVyska;
    }

    // 4. KOLIZE A LOGIKA (zůstává stejná)
    plastics.forEach((p, i) => {
        if (player.position.distanceTo(p.position) < 1.5) {
            scene.remove(p);
            plastics.splice(i, 1);
            plastCount++;
            document.getElementById('plast-count').innerText = plastCount;
            casRadosti = 0.4;
            
            const status = document.getElementById('status');
            if (plastCount >= 10) {
                status.innerText = "Mise splněna! " + plastCount + " plastů!";
                status.style.color = "#2ecc71";
            }
        }
    });

    // TĚŽBA BLOKŮ
    for (let i = blocks.length - 1; i >= 0; i--) {
        let b = blocks[i];
        // Když hráč narazí do bloku
        if (player.position.distanceTo(b.position) < 1.5) {
            // Zkontroluje, jestli má správný nástroj
            if (muzeTezit(b.userData.typ)) {
                scene.remove(b);                 // Zmizí ze světa
                inventar[b.userData.typ]++;      // Přidá do inventáře
                blocks.splice(i, 1);             // Smaže ze seznamu bloků
                
                // Aktualizuje HTML batoh
                let uiElement = document.getElementById('inv-' + b.userData.typ);
                if (uiElement) uiElement.innerText = inventar[b.userData.typ];
                
                casRadosti = 0.2; // Malý radostný poskok při natěžení
            } else {
                // Tady později přidáme kód, aby blok fungoval jako zeď (neprojde skrz)
            }
        }
    }

    // 5. KAMERA A RENDER
    camera.position.set(player.position.x, 10, player.position.z + 10);
    camera.lookAt(player.position.x, 1, player.position.z);
    renderer.render(scene, camera);
}
animate();