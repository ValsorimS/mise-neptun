import * as THREE from 'three';

// --- SCÉNA A KAMERA ---
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

// --- PODLAHA (MĚSÍC) ---
const textureLoader = new THREE.TextureLoader();
const moonTexture = textureLoader.load('mesic.jpg');
moonTexture.wrapS = moonTexture.wrapT = THREE.RepeatWrapping;
moonTexture.repeat.set(10, 10);
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80), 
    new THREE.MeshStandardMaterial({ map: moonTexture })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
scene.add(floor);

// --- HRÁČ (BANÁN) ---
const playerTexture = textureLoader.load('panacek_krok.png');
playerTexture.repeat.set(1 / 4, 1);
const player = new THREE.Sprite(new THREE.SpriteMaterial({ map: playerTexture, transparent: true }));
player.scale.set(2, 2, 1);
const vychoziVyska = 1.0;
player.position.y = vychoziVyska;
scene.add(player);

// --- INVENTÁŘ A NÁSTROJE ---
let inventar = { wood: 0, stone: 0, iron: 0, gold: 0, diamond: 0, dirt: 0 };

// Začínáme POUZE s dřevěnými nástroji!
const nastroje = {
    '1': { typ: "sekera", material: "wood", nazev: "Dřevěná sekera" },
    '2': { typ: "krumpac", material: "wood", nazev: "Dřevěný krumpáč" }, // Oslabeno na dřevo
    '3': { typ: "lopata", material: "wood", nazev: "Dřevěná lopata" }
};

let aktualniNastroj = nastroje['2']; 

// Funkce určující, co může hráč těžit (ZŮSTÁVÁ STEJNÁ JAKO MINULE)
function muzeTezit(typBloku) {
    if (typBloku === "dirt" && aktualniNastroj.typ === "lopata") return true;
    if (typBloku === "wood" && aktualniNastroj.typ === "sekera") return true;
    
    if (aktualniNastroj.typ === "krumpac") {
        if (typBloku === "stone") return true; 
        if (typBloku === "iron" && (aktualniNastroj.material === "stone" || aktualniNastroj.material === "iron" || aktualniNastroj.material === "diamond")) return true;
        if ((typBloku === "gold" || typBloku === "diamond") && (aktualniNastroj.material === "iron" || aktualniNastroj.material === "diamond")) return true;
    }
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
const obsazenePozice = new Set(); 

function pridajBlokChytre(typ, minX, maxX, minZ, maxZ) {
    for (let pokus = 0; pokus < 10; pokus++) {
        let x = Math.round((minX + Math.random() * (maxX - minX)) / 1.5) * 1.5;
        let z = Math.round((minZ + Math.random() * (maxZ - minZ)) / 1.5) * 1.5;
        let klic = `${x},${z}`; 

        if (!obsazenePozice.has(klic)) {
            obsazenePozice.add(klic); 
            const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
            const mesh = new THREE.Mesh(geometry, blockMaterials[typ]);
            mesh.position.set(x, 0.75, z); 
            mesh.userData = { typ: typ };  
            scene.add(mesh);
            blocks.push(mesh);
            return; 
        }
    }
}

// Generování biomu: LES (vlevo nahoře mapy)
for(let i = 0; i < 20; i++) {
    pridajBlokChytre("wood", -25, -5, -25, -5);
    pridajBlokChytre("dirt", -25, -5, -25, -5);
}

// Generování biomu: JESKYNĚ (vpravo dole mapy)
for(let i = 0; i < 30; i++) pridajBlokChytre("stone", 5, 25, 5, 25);
for(let i = 0; i < 8; i++) pridajBlokChytre("iron", 10, 25, 10, 25);
for(let i = 0; i < 6; i++) pridajBlokChytre("gold", 15, 25, 15, 25);
for(let i = 0; i < 5; i++) pridajBlokChytre("diamond", 18, 25, 18, 25);


// --- PLASTY (Původní mise) ---
const plasticTexture = textureLoader.load('plast.png');
let plastics = [];
for (let i = 0; i < 15; i++) {
    // Generujeme plasty jen do prázdných míst (okolo středu), aby nebyly ve stromech
    const p = new THREE.Sprite(new THREE.SpriteMaterial({ map: plasticTexture, transparent: true }));
    p.scale.set(0.6, 0.6, 1);
    p.position.set((Math.random() - 0.5) * 15, 0.5, (Math.random() - 0.5) * 15);
    scene.add(p);
    plastics.push(p);
}


// --- OVLÁDÁNÍ ---
const keys = { w: false, a: false, s: false, d: false };

window.addEventListener('keydown', (e) => { 
    if(keys.hasOwnProperty(e.key)) keys[e.key] = true; 
    
    // Přepínání nástrojů klávesami 1, 2, 3
    if (nastroje[e.key]) {
        aktualniNastroj = nastroje[e.key];
        // Aktualizace textu na obrazovce
        document.getElementById('current-tool').innerText = aktualniNastroj.nazev;
    }
});

window.addEventListener('keyup', (e) => { 
    if(keys.hasOwnProperty(e.key)) keys[e.key] = false; 
});

const joystick = window.nipplejs.create({ zone: document.getElementById('joystick-zone'), mode: 'static', position: { left: '50%', top: '50%' }, size: 100 });
let joystickVector = { x: 0, y: 0 };
joystick.on('move', (e, d) => { joystickVector.x = Math.cos(d.angle.radian) * (d.distance/50); joystickVector.y = Math.sin(d.angle.radian) * (d.distance/50); });
joystick.on('end', () => joystickVector = { x: 0, y: 0 });


// --- HLAVNÍ HERNÍ SMYČKA ---
const clock = new THREE.Clock();
let plastCount = 0;
let casRadosti = 0;
let aktualniSnimek = 0;

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    let hybeSe = false;
    let jeVlevo = false;

    // Uložení pozice pro fyziku (odrazy od zdí)
    let staraX = player.position.x;
    let staraZ = player.position.z;

    // 1. POHYB
    if (keys.a || joystickVector.x < -0.1) { 
        player.position.x -= 0.15; 
        jeVlevo = true; 
        hybeSe = true; 
    } else if (keys.d || joystickVector.x > 0.1) { 
        player.position.x += 0.15; 
        jeVlevo = false; 
        hybeSe = true; 
    }
    if (keys.w || joystickVector.y > 0.1) { player.position.z -= 0.15; hybeSe = true; }
    if (keys.s || joystickVector.y < -0.1) { player.position.z += 0.15; hybeSe = true; }

    // 2. ANIMACE CHŮZE BANÁNU
    if (hybeSe) {
        aktualniSnimek += 10 * delta;
        let frame = Math.floor(aktualniSnimek) % 2; 
        if (jeVlevo) {
            playerTexture.offset.x = 0.5 + (frame * 0.25); // Snímky pro chůzi vlevo
        } else {
            playerTexture.offset.x = frame * 0.25;         // Snímky pro chůzi vpravo
        }
    } else {
        playerTexture.offset.x = 0;
    }

    // 3. RADOSTNÝ VÝSKOK (Po natěžení nebo sebrání plastu)
    if (casRadosti > 0) {
        casRadosti -= delta;
        player.position.y = vychoziVyska + Math.sin((1 - (casRadosti / 0.4)) * Math.PI) * 0.8;
    } else {
        player.position.y = vychoziVyska;
    }

    // 4. FYZIKA A TĚŽBA BLOKŮ
    let narazilDoZdi = false;
    for (let i = blocks.length - 1; i >= 0; i--) {
        let b = blocks[i];
        if (player.position.distanceTo(b.position) < 1.2) { // 1.2 = hráč je těsně u kostky
            if (muzeTezit(b.userData.typ)) {
                // Hráč může těžit -> blok zmizí, přidá se do inventáře
                scene.remove(b);
                inventar[b.userData.typ]++;
                blocks.splice(i, 1);
                
                // Aktualizace UI textu
                let uiElement = document.getElementById('inv-' + b.userData.typ);
                if (uiElement) uiElement.innerText = inventar[b.userData.typ];
                
                casRadosti = 0.2; // Malý poskok
                obsazenePozice.delete(`${b.position.x},${b.position.z}`); // Uvolní místo v paměti
            } else {
                // Hráč nemá nástroj -> blok je neprostupná zeď
                narazilDoZdi = true;
            }
        }
    }
    // Pokud hráč narazil a nemá nástroj, vráti se na původní místo (neprojde)
    if (narazilDoZdi) {
        player.position.x = staraX;
        player.position.z = staraZ;
    }

    // 5. SBĚR PLASTŮ
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

    // 6. KAMERA A VYKRESLENÍ
    camera.position.set(player.position.x, 10, player.position.z + 10);
    camera.lookAt(player.position.x, 1, player.position.z);
    renderer.render(scene, camera);
}
document.getElementById('current-tool').innerText = aktualniNastroj.nazev;
animate();
// --- CRAFTING (VÝROBA) ---
function vyrobKrumpac(cilovyMaterial, cenaSuroviny, cenaDreva, novyNazev) {
    const msgBox = document.getElementById('craft-msg');
    
    // Kontrola, zda má hráč dostatek surovin
    if (inventar[cilovyMaterial] >= cenaSuroviny && inventar.wood >= cenaDreva) {
        
        // Odečtení surovin
        inventar[cilovyMaterial] -= cenaSuroviny;
        inventar.wood -= cenaDreva;
        
        // Vylepšení krumpáče (pod klávesou 2)
        nastroje['2'].material = cilovyMaterial;
        nastroje['2'].nazev = novyNazev;
        
        // Pokud má hráč zrovna krumpáč v ruce, zaktualizujeme text na obrazovce
        if (aktualniNastroj.typ === "krumpac") {
            document.getElementById('current-tool').innerText = novyNazev;
        }
        
        // Aktualizace batohu na obrazovce
        document.getElementById('inv-' + cilovyMaterial).innerText = inventar[cilovyMaterial];
        document.getElementById('inv-wood').innerText = inventar.wood;
        
        // Zpráva o úspěchu
        msgBox.innerText = "Vyrobeno!";
        msgBox.style.color = "#2ecc71";
        
        // Radostný výskok banánu
        casRadosti = 0.5;
        
    } else {
        // Zpráva o neúspěchu
        msgBox.innerText = "Chybí suroviny!";
        msgBox.style.color = "#e74c3c";
    }
    
    // Vymazání zprávy po 2 vteřinách
    setTimeout(() => { msgBox.innerText = ""; }, 2000);
}

// Napojení tlačítek z HTML na funkci
document.getElementById('btn-craft-stone').addEventListener('click', () => vyrobKrumpac('stone', 3, 2, 'Kamenný krumpáč'));
document.getElementById('btn-craft-iron').addEventListener('click', () => vyrobKrumpac('iron', 3, 2, 'Železný krumpáč'));
document.getElementById('btn-craft-diamond').addEventListener('click', () => vyrobKrumpac('diamond', 3, 2, 'Diamantový krumpáč'));