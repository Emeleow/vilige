// Game variables
let scene, camera, renderer, controls;
let dogs = [];
let leaderDog = null;
let score = 0;
let ammo = 100; // Start with 100 ammo
let gameOver = false;
let gameStarted = false;
let gamePaused = false;
let villageObjects = [];
let playerHealth = 18; // Start with 18 hearts
let maxHealth = 18; // Maximum health
let currentWeapon = 'pistol';
let powerUpAvailable = false;
let powerUpPosition = new THREE.Vector3();
let lastAttackTime = 0;
let attackCooldown = 1000; // 1 second cooldown between dog attacks
let lastDogBiteTime = 0; // Track last dog bite time
let dogBiteCooldown = 1000; // 1 second cooldown between dog bites
let distanceTraveled = 0;
let lastPosition = new THREE.Vector3();
let bossSpawned = false;
let bossSpawnDistance = 100; // Distance to travel before boss spawns
let bandages = []; // Array to store bandages
let bandageCount = 0; // Number of bandages collected
let maxBandages = 3; // Maximum number of bandages player can carry
let lastHealTime = 0;
let healCooldown = 5000; // 5 seconds cooldown between heals
let gamePhase = 0; // 0: exploration, 1: combat
let explorationTime = 0; // Time spent in exploration phase
let explorationDuration = 10000; // 10 seconds of exploration before combat phase
let isJumping = false;
let jumpHeight = 0;
let maxJumpHeight = 2;
let jumpSpeed = 0.1;
let gravity = 0.05;
let houses = []; // Array to store houses for ammo reload
let animationFrameId = null; // Store animation frame ID for cleanup
let ammoPickups = []; // Array to store ammo pickups on the ground
let bossHitCount = 0; // Count hits on boss to track when to reduce health
let victoryCelebration = false; // Flag for victory celebration
let victoryTime = 0; // Time for victory celebration
let victoryDuration = 10000; // 10 seconds of victory celebration
let shotgunAvailable = false; // Flag for shotgun availability
let shotgunPosition = new THREE.Vector3(); // Position for shotgun
let shotgunModel; // Model for shotgun
let victoryStars = []; // Array to store victory stars
let victoryAudio; // Audio for victory celebration
// New movement variables
let isSprinting = false;
let walkCycle = 0;
let walkSpeed = 0.15; // Base walking speed
let sprintMultiplier = 1.6; // Sprint speed multiplier
let bobAmount = 0.05; // Amount of camera bobbing
let bobSpeed = 0.1; // Speed of camera bobbing
let moveDirection = new THREE.Vector3();
let moveSpeed = 0.15;
let lastFrameTime = 0;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

// Load 3D models
const modelLoader = new THREE.GLTFLoader();
let playerModel, dogModel, leaderDogModel, pistolModel, sniperModel, bandageModel;

// Load textures
const blackDogTexture = new THREE.TextureLoader().load('https://cdn.pixabay.com/photo/2016/12/13/05/15/puppy-1903313_960_720.png');
const brownDogTexture = new THREE.TextureLoader().load('https://cdn.pixabay.com/photo/2016/12/13/05/15/puppy-1903313_960_720.png');
const bandageTexture = new THREE.TextureLoader().load('https://cdn.pixabay.com/photo/2017/03/08/14/20/flat-2126884_960_720.png');

// Initialize the game
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    scene.fog = new THREE.Fog(0x87CEEB, 20, 100); // Add fog for better depth perception
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 1.7; // Eye level
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    // Create village environment
    createVillage();
    
    // Load models
    loadModels();
    
    // Create initial dogs (small ones)
    createDogs();
    
    // Create bandages
    createBandages();
    
    // Create ammo pickups
    createAmmoPickups();
    
    // Set up controls
    controls = new THREE.PointerLockControls(camera, document.body);
    
    // Event listeners
    document.getElementById('startButton').addEventListener('click', startGame);
    document.getElementById('restartButton').addEventListener('click', restartGame);
    document.getElementById('exitButton').addEventListener('click', exitGame);
    document.getElementById('pauseButton').addEventListener('click', togglePause);
    document.getElementById('resumeButton').addEventListener('click', resumeGame);
    document.getElementById('restartFromPauseButton').addEventListener('click', restartFromPause);
    document.getElementById('exitFromPauseButton').addEventListener('click', exitGame);
    
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
    
    // Handle visibility change (tab switch, minimize, etc.)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Handle beforeunload (browser close, refresh, etc.)
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Store initial position
    lastPosition.copy(camera.position);
    
    // Start game loop
    animate();
}

// Load 3D models
function loadModels() {
    // Load player model (first person view)
    modelLoader.load('https://threejs.org/examples/models/gltf/Soldier.glb', function(gltf) {
        playerModel = gltf.scene;
        playerModel.scale.set(0.1, 0.1, 0.1);
        playerModel.position.set(0, -1.5, -0.5);
        camera.add(playerModel);
    });
    
    // Load dog model - using a more realistic dog model
    modelLoader.load('https://threejs.org/examples/models/gltf/Dog.glb', function(gltf) {
        dogModel = gltf.scene;
        dogModel.scale.set(0.3, 0.3, 0.3); // Make dogs smaller
        
        // Add fur material to make it look more realistic
        dogModel.traverse(function(child) {
            if (child.isMesh) {
                child.material.roughness = 0.8;
                child.material.metalness = 0.2;
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    });
    
    // Load leader dog model (larger version)
    modelLoader.load('https://threejs.org/examples/models/gltf/Dog.glb', function(gltf) {
        leaderDogModel = gltf.scene;
        leaderDogModel.scale.set(1.5, 1.5, 1.5); // Make leader dog much larger
        
        // Add fur material to make it look more realistic
        leaderDogModel.traverse(function(child) {
            if (child.isMesh) {
                child.material.roughness = 0.8;
                child.material.metalness = 0.2;
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    });
    
    // Load weapon models
    modelLoader.load('https://threejs.org/examples/models/gltf/Gun.glb', function(gltf) {
        pistolModel = gltf.scene;
        pistolModel.scale.set(0.1, 0.1, 0.1);
        pistolModel.position.set(0.3, -0.3, -0.5);
        camera.add(pistolModel);
    });
    
    modelLoader.load('https://threejs.org/examples/models/gltf/Sniper.glb', function(gltf) {
        sniperModel = gltf.scene;
        sniperModel.scale.set(0.1, 0.1, 0.1);
        sniperModel.position.set(0.3, -0.3, -0.5);
        sniperModel.visible = false;
        camera.add(sniperModel);
    });
    
    // Load bandage model
    modelLoader.load('https://threejs.org/examples/models/gltf/FirstAidKit.glb', function(gltf) {
        bandageModel = gltf.scene;
        bandageModel.scale.set(0.2, 0.2, 0.2);
        
        // Add material to make it look more realistic
        bandageModel.traverse(function(child) {
            if (child.isMesh) {
                child.material.roughness = 0.5;
                child.material.metalness = 0.1;
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    });
    
    // Load shotgun model
    modelLoader.load('https://threejs.org/examples/models/gltf/Sniper.glb', function(gltf) {
        shotgunModel = gltf.scene;
        shotgunModel.scale.set(0.1, 0.1, 0.1);
        shotgunModel.position.set(0.3, -0.3, -0.5);
        shotgunModel.visible = false;
        camera.add(shotgunModel);
    });
}

// Create village environment
function createVillage() {
    // Ground
    const groundGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x3CB371,
        side: THREE.DoubleSide,
        roughness: 0.8,
        metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Add some terrain variation
    for (let i = 0; i < 20; i++) {
        const hillGeometry = new THREE.ConeGeometry(5 + Math.random() * 10, 2 + Math.random() * 3, 8);
        const hillMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2E8B57,
            roughness: 0.8,
            metalness: 0.2
        });
        const hill = new THREE.Mesh(hillGeometry, hillMaterial);
        
        // Random position
        const angle = Math.random() * Math.PI * 2;
        const radius = 30 + Math.random() * 70;
        hill.position.x = Math.cos(angle) * radius;
        hill.position.z = Math.sin(angle) * radius;
        hill.position.y = 1;
        hill.rotation.y = Math.random() * Math.PI;
        
        hill.castShadow = true;
        hill.receiveShadow = true;
        scene.add(hill);
        villageObjects.push(hill);
    }
    
    // Houses
    for (let i = 0; i < 20; i++) {
        const houseGeometry = new THREE.BoxGeometry(5, 4, 5);
        const houseMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            roughness: 0.7,
            metalness: 0.1
        });
        const house = new THREE.Mesh(houseGeometry, houseMaterial);
        
        // Random position in a circle around the player
        const angle = Math.random() * Math.PI * 2;
        const radius = 20 + Math.random() * 80;
        house.position.x = Math.cos(angle) * radius;
        house.position.z = Math.sin(angle) * radius;
        house.position.y = 2;
        
        house.castShadow = true;
        house.receiveShadow = true;
        scene.add(house);
        villageObjects.push(house);
        houses.push(house); // Add to houses array for ammo reload
        
        // Add roof
        const roofGeometry = new THREE.ConeGeometry(4, 2, 4);
        const roofMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B0000,
            roughness: 0.7,
            metalness: 0.1
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 3;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        house.add(roof);
        
        // Add door
        const doorGeometry = new THREE.PlaneGeometry(1, 2);
        const doorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4B2F0D,
            side: THREE.DoubleSide,
            roughness: 0.9,
            metalness: 0.1
        });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(0, -1, 2.51);
        door.castShadow = true;
        house.add(door);
        
        // Add windows
        for (let j = 0; j < 2; j++) {
            const windowGeometry = new THREE.PlaneGeometry(0.8, 0.8);
            const windowMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xADD8E6,
                side: THREE.DoubleSide,
                roughness: 0.3,
                metalness: 0.8
            });
            const window = new THREE.Mesh(windowGeometry, windowMaterial);
            window.position.set(-1.5 + j * 3, 0.5, 2.51);
            window.castShadow = true;
            house.add(window);
        }
        
        // Add ammo box indicator
        const ammoBoxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const ammoBoxMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFFF00,
            roughness: 0.5,
            metalness: 0.5
        });
        const ammoBox = new THREE.Mesh(ammoBoxGeometry, ammoBoxMaterial);
        ammoBox.position.set(0, 2, 0);
        ammoBox.userData = { type: 'ammoBox' };
        house.add(ammoBox);
    }
    
    // Trees
    for (let i = 0; i < 40; i++) {
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 3, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            roughness: 0.9,
            metalness: 0.1
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        
        const leavesGeometry = new THREE.ConeGeometry(2, 4, 8);
        const leavesMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x228B22,
            roughness: 0.8,
            metalness: 0.1
        });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = 3.5;
        
        const tree = new THREE.Group();
        tree.add(trunk);
        tree.add(leaves);
        
        // Random position
        const angle = Math.random() * Math.PI * 2;
        const radius = 10 + Math.random() * 90;
        tree.position.x = Math.cos(angle) * radius;
        tree.position.z = Math.sin(angle) * radius;
        
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        leaves.castShadow = true;
        leaves.receiveShadow = true;
        
        scene.add(tree);
        villageObjects.push(tree);
    }
    
    // Add fences
    for (let i = 0; i < 15; i++) {
        const fenceLength = 10 + Math.random() * 20;
        const fenceGroup = new THREE.Group();
        
        // Fence posts
        for (let j = 0; j <= fenceLength; j += 2) {
            const postGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8);
            const postMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x8B4513,
                roughness: 0.9,
                metalness: 0.1
            });
            const post = new THREE.Mesh(postGeometry, postMaterial);
            post.position.set(j, 0.75, 0);
            post.castShadow = true;
            post.receiveShadow = true;
            fenceGroup.add(post);
        }
        
        // Fence rails
        for (let j = 0; j < 3; j++) {
            const railGeometry = new THREE.CylinderGeometry(0.05, 0.05, fenceLength, 8);
            const railMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x8B4513,
                roughness: 0.9,
                metalness: 0.1
            });
            const rail = new THREE.Mesh(railGeometry, railMaterial);
            rail.rotation.z = Math.PI / 2;
            rail.position.set(fenceLength / 2, 0.3 + j * 0.3, 0);
            rail.castShadow = true;
            rail.receiveShadow = true;
            fenceGroup.add(rail);
        }
        
        // Position fence
        const angle = Math.random() * Math.PI * 2;
        const radius = 30 + Math.random() * 60;
        fenceGroup.position.x = Math.cos(angle) * radius;
        fenceGroup.position.z = Math.sin(angle) * radius;
        fenceGroup.rotation.y = Math.random() * Math.PI;
        
        scene.add(fenceGroup);
        villageObjects.push(fenceGroup);
    }
    
    // Add rocks
    for (let i = 0; i < 30; i++) {
        const rockGeometry = new THREE.DodecahedronGeometry(0.5 + Math.random() * 1, 0);
        const rockMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x808080,
            roughness: 0.9,
            metalness: 0.1
        });
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        
        // Random position
        const angle = Math.random() * Math.PI * 2;
        const radius = 10 + Math.random() * 90;
        rock.position.x = Math.cos(angle) * radius;
        rock.position.z = Math.sin(angle) * radius;
        rock.position.y = 0.25 + Math.random() * 0.5;
        
        rock.rotation.x = Math.random() * Math.PI;
        rock.rotation.y = Math.random() * Math.PI;
        rock.rotation.z = Math.random() * Math.PI;
        
        rock.castShadow = true;
        rock.receiveShadow = true;
        
        scene.add(rock);
        villageObjects.push(rock);
    }
}

// Create bandages
function createBandages() {
    // Create 5 bandages scattered around the world
    for (let i = 0; i < 5; i++) {
        let bandage;
        
        if (bandageModel) {
            bandage = bandageModel.clone();
            bandage.scale.set(0.2, 0.2, 0.2);
        } else {
            // Fallback to simple geometry if model not loaded
            const bandageGeometry = new THREE.BoxGeometry(0.5, 0.2, 0.5);
            const bandageMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xFFFFFF,
                map: bandageTexture
            });
            bandage = new THREE.Mesh(bandageGeometry, bandageMaterial);
        }
        
        // Random position
        const angle = Math.random() * Math.PI * 2;
        const radius = 20 + Math.random() * 80;
        bandage.position.x = Math.cos(angle) * radius;
        bandage.position.z = Math.sin(angle) * radius;
        bandage.position.y = 0.1;
        
        // Add bandage properties
        bandage.userData = {
            type: 'bandage',
            healAmount: 2 // Heals 2 hearts
        };
        
        bandage.castShadow = true;
        bandage.receiveShadow = true;
        
        scene.add(bandage);
        bandages.push(bandage);
    }
}

// Create regular dogs
function createDogs() {
    for (let i = 0; i < 20; i++) {
        let dog;
        
        if (dogModel) {
            dog = dogModel.clone();
            dog.scale.set(0.3, 0.3, 0.3);
        } else {
            const dogGeometry = new THREE.BoxGeometry(0.5, 0.5, 1);
            const dogMaterial = new THREE.MeshStandardMaterial({ 
                color: Math.random() < 0.5 ? 0x000000 : 0x8B4513,
                map: Math.random() < 0.5 ? blackDogTexture : brownDogTexture
            });
            dog = new THREE.Mesh(dogGeometry, dogMaterial);
        }
        
        // Random position
        const angle = Math.random() * Math.PI * 2;
        const radius = 15 + Math.random() * 25;
        dog.position.x = Math.cos(angle) * radius;
        dog.position.z = Math.sin(angle) * radius;
        dog.position.y = 0.25;
        
        // Add dog properties
        dog.userData = {
            health: 100,
            speed: 0.03 + Math.random() * 0.02,
            type: Math.random() < 0.5 ? 'black' : 'brown',
            lastAttackTime: 0,
            attackCooldown: 1000 + Math.random() * 500,
            damage: 0.5, // Half a heart damage
            attackRange: 1.5 + Math.random() * 0.5,
            state: 'idle',
            detectionRange: 10 + Math.random() * 5,
            idleTime: 0,
            idleDuration: 2000 + Math.random() * 3000,
            idlePosition: new THREE.Vector3().copy(dog.position),
            idleRadius: 2 + Math.random() * 3,
            isJumping: false,
            jumpHeight: 0,
            maxJumpHeight: 1.5,
            jumpSpeed: 0.1,
            jumpCooldown: 2000,
            lastJumpTime: 0,
            attackPhase: 'approach',
            hasBitten: false,
            retreatDistance: 2 + Math.random() * 1 // Distance to retreat after biting
        };
        
        dog.castShadow = true;
        dog.receiveShadow = true;
        
        scene.add(dog);
        dogs.push(dog);
    }
}

// Create leader dog
function createLeaderDog() {
    const leaderDog = leaderDogModel.clone();
    leaderDog.scale.set(1.5, 1.5, 1.5);
    
    // Set up leader dog properties
    leaderDog.userData = {
        type: 'leader',
        health: 30,
        maxHealth: 30,
        speed: 0.15,
        damage: 1.5, // One and a half hearts damage
        attackRange: 2,
        detectionRange: 25,
        shotDetectionRange: 40,
        shotReactionTime: 500,
        lastShotTime: 0,
        isAngry: false,
        state: 'idle',
        attackPhase: 'approach',
        isJumping: false,
        jumpHeight: 0,
        jumpSpeed: 0.1,
        maxJumpHeight: 2,
        lastJumpTime: 0,
        jumpCooldown: 1000,
        hasBitten: false,
        idleTime: 0,
        idleDuration: 2000,
        idleRadius: 5,
        idlePosition: new THREE.Vector3(),
        retreatDistance: 3 // Distance to retreat after biting
    };
    
    // Position the leader dog
    const angle = Math.random() * Math.PI * 2;
    const radius = 20;
    leaderDog.position.set(
        Math.cos(angle) * radius,
        0.25,
        Math.sin(angle) * radius
    );
    
    // Set initial idle position
    leaderDog.userData.idlePosition.copy(leaderDog.position);
    
    // Add to scene
    scene.add(leaderDog);
    
    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(1.2, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xFF0000,
        transparent: true,
        opacity: 0.3,
        depthWrite: false
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.renderOrder = 2;
    leaderDog.add(glow);
    
    return leaderDog;
}

// Create boss health bar
function createBossHealthBar() {
    // Create container for boss health bar
    const bossHealthContainer = document.createElement('div');
    bossHealthContainer.id = 'bossHealthContainer';
    bossHealthContainer.style.position = 'absolute';
    bossHealthContainer.style.top = '10%';
    bossHealthContainer.style.left = '50%';
    bossHealthContainer.style.transform = 'translate(-50%, -50%)';
    bossHealthContainer.style.width = '300px';
    bossHealthContainer.style.height = '20px';
    bossHealthContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    bossHealthContainer.style.border = '2px solid white';
    bossHealthContainer.style.borderRadius = '10px';
    bossHealthContainer.style.zIndex = '100';
    
    // Create boss health bar
    const bossHealthBar = document.createElement('div');
    bossHealthBar.id = 'bossHealthBar';
    bossHealthBar.style.width = '100%';
    bossHealthBar.style.height = '100%';
    bossHealthBar.style.backgroundColor = 'red';
    bossHealthBar.style.borderRadius = '8px';
    bossHealthContainer.appendChild(bossHealthBar);
    
    // Create boss health text
    const bossHealthText = document.createElement('div');
    bossHealthText.id = 'bossHealthText';
    bossHealthText.style.position = 'absolute';
    bossHealthText.style.top = '50%';
    bossHealthText.style.left = '50%';
    bossHealthText.style.transform = 'translate(-50%, -50%)';
    bossHealthText.style.color = 'white';
    bossHealthText.style.fontWeight = 'bold';
    bossHealthText.textContent = 'Boss: 30/30';
    bossHealthContainer.appendChild(bossHealthText);
    
    // Add to document
    document.body.appendChild(bossHealthContainer);
}

// Update boss health bar
function updateBossHealthBar() {
    if (!leaderDog) return;
    
    const healthBar = document.getElementById('bossHealthBar');
    const healthText = document.getElementById('bossHealthText');
    
    if (healthBar && healthText) {
        const healthPercent = (leaderDog.userData.health / leaderDog.userData.maxHealth) * 100;
        healthBar.style.width = `${healthPercent}%`;
        healthText.textContent = `Boss: ${leaderDog.userData.health}/${leaderDog.userData.maxHealth}`;
        
        // Change color based on health
        if (healthPercent > 50) {
            healthBar.style.backgroundColor = 'red';
        } else if (healthPercent > 25) {
            healthBar.style.backgroundColor = 'orange';
        } else {
            healthBar.style.backgroundColor = 'darkred';
        }
    }
}

// Start the game
function startGame() {
    document.getElementById('startScreen').style.display = 'none';
    controls.lock();
    gameStarted = true;
    gamePaused = false;
    gamePhase = 0; // Start in exploration phase
    explorationTime = 0;
    
    // Show exploration message
    const message = document.createElement('div');
    message.id = 'phaseMessage';
    message.style.position = 'absolute';
    message.style.top = '50%';
    message.style.left = '50%';
    message.style.transform = 'translate(-50%, -50%)';
    message.style.color = 'white';
    message.style.fontSize = '24px';
    message.style.textAlign = 'center';
    message.style.zIndex = '100';
    message.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    message.style.padding = '20px';
    message.style.borderRadius = '10px';
    message.innerHTML = 'Explore the village. Dogs will become aggressive if you get too close to them.';
    document.body.appendChild(message);
    
    // Remove message after 5 seconds
    setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }, 5000);
}

// Restart the game
function restartGame() {
    // Reset game variables
    score = 0;
    ammo = 100; // Reset to 100 ammo
    gameOver = false;
    gamePaused = false;
    playerHealth = 18;
    distanceTraveled = 0;
    bossSpawned = false;
    bandageCount = 0;
    gamePhase = 0;
    explorationTime = 0;
    isJumping = false;
    jumpHeight = 0;
    bossHitCount = 0; // Reset boss hit count
    
    // Remove all dogs
    dogs.forEach(dog => {
        scene.remove(dog);
    });
    dogs = [];
    
    if (leaderDog) {
        scene.remove(leaderDog);
        leaderDog = null;
    }
    
    // Remove boss health bar
    const bossHealthContainer = document.getElementById('bossHealthContainer');
    if (bossHealthContainer) {
        bossHealthContainer.remove();
    }
    
    // Remove all bandages
    bandages.forEach(bandage => {
        scene.remove(bandage);
    });
    bandages = [];
    
    // Remove all ammo pickups
    ammoPickups.forEach(ammoPickup => {
        scene.remove(ammoPickup);
    });
    ammoPickups = [];
    
    // Create new bandages
    createBandages();
    
    // Create new ammo pickups
    createAmmoPickups();
    
    // Reset player position
    camera.position.set(0, 1.7, 0);
    lastPosition.copy(camera.position);
    
    // Create new dogs
    createDogs();
    
    // Update displays
    updateScoreDisplay();
    updateHealthDisplay();
    updateAmmoDisplay();
    updateBandageDisplay();
    
    // Hide game over screen
    document.getElementById('gameOverScreen').style.display = 'none';
    
    // Lock controls
    controls.lock();
    gameStarted = true;
    
    // Show exploration message
    const message = document.createElement('div');
    message.id = 'phaseMessage';
    message.style.position = 'absolute';
    message.style.top = '50%';
    message.style.left = '50%';
    message.style.transform = 'translate(-50%, -50%)';
    message.style.color = 'white';
    message.style.fontSize = '24px';
    message.style.textAlign = 'center';
    message.style.zIndex = '100';
    message.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    message.style.padding = '20px';
    message.style.borderRadius = '10px';
    message.innerHTML = 'Explore the village. Dogs will become aggressive if you get too close to them.';
    document.body.appendChild(message);
    
    // Remove message after 5 seconds
    setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }, 5000);
}

// Restart from pause menu
function restartFromPause() {
    document.getElementById('pauseMenu').style.display = 'none';
    restartGame();
}

// Toggle pause state
function togglePause() {
    if (!gameStarted || gameOver) return;
    
    if (gamePaused) {
        resumeGame();
    } else {
        pauseGame();
    }
}

// Pause the game
function pauseGame() {
    if (!gameStarted || gameOver) return;
    
    gamePaused = true;
    controls.unlock();
    document.getElementById('pauseMenu').style.display = 'flex';
}

// Resume the game
function resumeGame() {
    if (!gameStarted || gameOver) return;
    
    gamePaused = false;
    controls.lock();
    document.getElementById('pauseMenu').style.display = 'none';
}

// Exit the game
function exitGame() {
    // Reset game state
    gameStarted = false;
    gamePaused = false;
    
    // Unlock controls
    controls.unlock();
    
    // Hide all game screens
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('pauseMenu').style.display = 'none';
    
    // Show start screen
    document.getElementById('startScreen').style.display = 'flex';
    
    // Reset game variables
    score = 0;
    ammo = 100; // Reset to 100 ammo
    gameOver = false;
    playerHealth = 18;
    distanceTraveled = 0;
    bossSpawned = false;
    bandageCount = 0;
    gamePhase = 0;
    explorationTime = 0;
    isJumping = false;
    jumpHeight = 0;
    
    // Update displays
    updateScoreDisplay();
    updateHealthDisplay();
    updateAmmoDisplay();
    updateBandageDisplay();
}

// Handle visibility change (tab switch, minimize, etc.)
function handleVisibilityChange() {
    if (document.hidden && gameStarted && !gameOver && !gamePaused) {
        // Auto-pause when tab is switched or window is minimized
        pauseGame();
    }
}

// Handle beforeunload (browser close, refresh, etc.)
function handleBeforeUnload(event) {
    if (gameStarted && !gameOver) {
        // Save game state if needed
        // For now, just show a confirmation message
        const message = "Are you sure you want to leave? Your progress will be lost.";
        event.returnValue = message;
        return message;
    }
}

// Handle mouse input
function onMouseDown(event) {
    if (!gameStarted || gameOver || gamePaused) return;
    
    // Left click to shoot
    if (event.button === 0) {
        shoot();
    }
}

// Handle keyboard input
function onKeyDown(event) {
    if (!gameStarted || gameOver || gamePaused) return;
    
    switch (event.code) {
        case 'KeyW':
            moveForward = true;
            break;
        case 'KeyS':
            moveBackward = true;
            break;
        case 'KeyA':
            moveLeft = true;
            break;
        case 'KeyD':
            moveRight = true;
            break;
        case 'Space':
            if (!isJumping) {
                isJumping = true;
                jumpHeight = 0;
            }
            break;
        case 'ShiftLeft':
            isSprinting = true;
            break;
        case 'KeyR':
            reload();
            break;
        case 'KeyE':
            pickupPowerUp();
            break;
        case 'KeyH':
            useBandage();
            break;
        case 'Escape':
            togglePause();
            break;
    }
}

// Handle key up events
function onKeyUp(event) {
    switch (event.code) {
        case 'KeyW':
            moveForward = false;
            break;
        case 'KeyS':
            moveBackward = false;
            break;
        case 'KeyA':
            moveLeft = false;
            break;
        case 'KeyD':
            moveRight = false;
            break;
        case 'ShiftLeft':
            isSprinting = false;
            break;
        case 'Escape':
            event.preventDefault();
            break;
    }
}

// Shooting function
function shoot() {
    if (ammo <= 0) {
        reload();
        return;
    }
    
    ammo--;
    updateAmmoDisplay();
    
    // Create raycaster for shooting
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    
    // Check for hits
    const targets = [...dogs, leaderDog].filter(dog => dog && dog.userData.health > 0);
    const intersects = raycaster.intersectObjects(targets);
    
    if (intersects.length > 0) {
        const hitDog = intersects[0].object;
        
        // Apply damage based on weapon
        let damage = 0;
        
        if (hitDog.userData.type === 'leader') {
            // For leader dog, track hits and reduce health every 3 hits
            bossHitCount++;
            
            // Update boss's last shot time
            hitDog.userData.lastShotTime = Date.now();
            
            if (currentWeapon === 'pistol') {
                // Regular pistol: 3 hits = 1 heart
                if (bossHitCount % 3 === 0) {
                    hitDog.userData.health -= 1;
                }
            } else if (currentWeapon === 'sniper') {
                // Sniper rifle: 1 hit = 1 heart
                hitDog.userData.health -= 1;
            }
            
            // Check if leader dog is at half health (15 hearts)
            if (!hitDog.userData.isAngry && hitDog.userData.health <= 15) {
                hitDog.userData.isAngry = true;
                hitDog.userData.phase = 2;
                hitDog.userData.damage = 2.5; // 2.5 hearts
                hitDog.userData.speed = 0.06; // Faster
                hitDog.userData.detectionRange = 35; // Increased detection range when angry
                
                // Add visual effect for angry transformation
                hitDog.material.emissive.setHex(0xFF0000);
                hitDog.material.emissiveIntensity = 0.8;
                
                // Show warning with pause
                showWarningMessage("The leader dog is getting angry! It's becoming more aggressive!");
                
                // Spawn power-up after a short delay
                setTimeout(() => {
                    spawnPowerUpNearPlayer();
                    showWarningMessage("A new weapon has appeared nearby! It might help against the angry boss!");
                }, 2000);
            }
        } else {
            // Regular dogs take full damage
            damage = currentWeapon === 'pistol' ? 50 : 100;
            hitDog.userData.health -= damage;
        }
        
        // Visual feedback for hit
        const originalColor = hitDog.material.color.getHex();
        hitDog.material.color.set(0xFF0000);
        setTimeout(() => {
            hitDog.material.color.set(originalColor);
        }, 100);
        
        // Check if dog is dead
        if (hitDog.userData.health <= 0) {
            if (hitDog === leaderDog) {
                // Boss defeated - start victory celebration
                startVictoryCelebration();
                
                // Remove boss health bar
                const bossHealthContainer = document.getElementById('bossHealthContainer');
                if (bossHealthContainer) {
                    bossHealthContainer.remove();
                }
            } else {
                scene.remove(hitDog);
                dogs = dogs.filter(dog => dog !== hitDog);
                score += 10;
                updateScoreDisplay();
            }
        }
    }
}

// Spawn power-up near player
function spawnPowerUpNearPlayer() {
    powerUpAvailable = true;
    
    // Position power-up very close to the player
    const angle = Math.random() * Math.PI * 2;
    const radius = 3; // Much closer to player
    powerUpPosition.set(
        camera.position.x + Math.cos(angle) * radius,
        0.5,
        camera.position.z + Math.sin(angle) * radius
    );
    
    // Create power-up object
    const powerUpGeometry = new THREE.BoxGeometry(1, 1, 1);
    const powerUpMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFFFF00,
        emissive: 0xFFFF00,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8
    });
    const powerUp = new THREE.Mesh(powerUpGeometry, powerUpMaterial);
    powerUp.position.copy(powerUpPosition);
    powerUp.userData = { type: 'sniper' };
    
    // Add floating animation
    powerUp.userData.initialY = powerUp.position.y;
    powerUp.userData.floatOffset = Math.random() * Math.PI * 2;
    
    powerUp.castShadow = true;
    powerUp.receiveShadow = true;
    
    scene.add(powerUp);
    villageObjects.push(powerUp);
}

// Start victory celebration
function startVictoryCelebration() {
    victoryCelebration = true;
    victoryTime = Date.now();
    
    // Play victory sound
    playVictorySound();
    
    // Create victory stars
    createVictoryStars();
    
    // Spawn shotgun reward
    spawnShotgunReward();
    
    // Show victory message
    showVictoryMessage();
    
    // Create victory fireworks
    createVictoryFireworks();
    
    // Pause game for celebration
    gamePaused = true;
    
    // Resume game after celebration
    setTimeout(() => {
        gamePaused = false;
    }, victoryDuration);
}

// Play victory sound
function playVictorySound() {
    // Create audio element for victory sound
    victoryAudio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3');
    victoryAudio.volume = 0.5;
    victoryAudio.play();
}

// Create victory stars
function createVictoryStars() {
    // Create 20 stars
    for (let i = 0; i < 20; i++) {
        const starGeometry = new THREE.OctahedronGeometry(0.5, 0);
        const starMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFFF00,
            emissive: 0xFFFF00,
            emissiveIntensity: 0.5
        });
        const star = new THREE.Mesh(starGeometry, starMaterial);
        
        // Random position around the player
        const angle = Math.random() * Math.PI * 2;
        const radius = 5 + Math.random() * 10;
        star.position.set(
            camera.position.x + Math.cos(angle) * radius,
            2 + Math.random() * 5,
            camera.position.z + Math.sin(angle) * radius
        );
        
        // Add animation properties
        star.userData = {
            type: 'victoryStar',
            floatSpeed: 0.01 + Math.random() * 0.02,
            rotateSpeed: 0.01 + Math.random() * 0.02,
            floatOffset: Math.random() * Math.PI * 2,
            initialY: star.position.y
        };
        
        star.castShadow = true;
        star.receiveShadow = true;
        
        scene.add(star);
        victoryStars.push(star);
    }
}

// Spawn shotgun reward
function spawnShotgunReward() {
    shotgunAvailable = true;
    
    // Position shotgun in front of the player
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(camera.quaternion);
    forward.y = 0;
    forward.normalize();
    
    shotgunPosition.set(
        camera.position.x + forward.x * 3,
        0.5,
        camera.position.z + forward.z * 3
    );
    
    // Create shotgun object
    const shotgunGeometry = new THREE.BoxGeometry(1, 0.3, 0.2);
    const shotgunMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B4513,
        roughness: 0.7,
        metalness: 0.3
    });
    const shotgun = new THREE.Mesh(shotgunGeometry, shotgunMaterial);
    shotgun.position.copy(shotgunPosition);
    shotgun.userData = { type: 'shotgun' };
    
    // Add floating animation
    shotgun.userData.initialY = shotgun.position.y;
    shotgun.userData.floatOffset = Math.random() * Math.PI * 2;
    
    shotgun.castShadow = true;
    shotgun.receiveShadow = true;
    
    scene.add(shotgun);
    villageObjects.push(shotgun);
    
    // Show message about shotgun
    showMessage("A powerful shotgun has appeared! Press E to pick it up.");
}

// Show victory message
function showVictoryMessage() {
    // Create victory message element
    const victoryElement = document.createElement('div');
    victoryElement.id = 'victoryMessage';
    victoryElement.style.position = 'absolute';
    victoryElement.style.top = '30%';
    victoryElement.style.left = '50%';
    victoryElement.style.transform = 'translate(-50%, -50%)';
    victoryElement.style.color = 'gold';
    victoryElement.style.fontSize = '36px';
    victoryElement.style.textAlign = 'center';
    victoryElement.style.zIndex = '100';
    victoryElement.style.fontWeight = 'bold';
    victoryElement.style.textShadow = '0 0 10px #FFD700, 0 0 20px #FFD700, 0 0 30px #FFD700';
    victoryElement.innerHTML = 'VICTORY!<br>You have defeated the leader dog!';
    
    // Add to document
    document.body.appendChild(victoryElement);
    
    // Remove after celebration
    setTimeout(() => {
        if (victoryElement.parentNode) {
            victoryElement.parentNode.removeChild(victoryElement);
        }
    }, victoryDuration);
}

// Show message
function showMessage(message) {
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.id = 'gameMessage';
    messageElement.style.position = 'absolute';
    messageElement.style.top = '70%';
    messageElement.style.left = '50%';
    messageElement.style.transform = 'translate(-50%, -50%)';
    messageElement.style.color = 'white';
    messageElement.style.fontSize = '18px';
    messageElement.style.textAlign = 'center';
    messageElement.style.zIndex = '100';
    messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    messageElement.style.padding = '10px 20px';
    messageElement.style.borderRadius = '5px';
    messageElement.textContent = message;
    
    // Add to document
    document.body.appendChild(messageElement);
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
        }
    }, 5000);
}

// Pick up power-up
function pickupPowerUp() {
    if (!powerUpAvailable && !shotgunAvailable) return;
    
    // Check if player is close to power-up
    if (powerUpAvailable) {
        const distance = camera.position.distanceTo(powerUpPosition);
        if (distance < 3) {
            // Switch to sniper
            currentWeapon = 'sniper';
            
            // Update weapon models
            if (pistolModel) pistolModel.visible = false;
            if (sniperModel) sniperModel.visible = true;
            
            // Remove power-up from scene
            villageObjects.forEach(obj => {
                if (obj.userData && obj.userData.type === 'sniper') {
                    scene.remove(obj);
                }
            });
            
            powerUpAvailable = false;
            
            // Show warning with pause
            showWarningMessage("You picked up the sniper rifle! This powerful weapon can damage the boss dog with each shot!");
        }
    }
    
    // Check if player is close to shotgun
    if (shotgunAvailable) {
        const distance = camera.position.distanceTo(shotgunPosition);
        if (distance < 3) {
            // Switch to shotgun
            currentWeapon = 'shotgun';
            
            // Update weapon models
            if (pistolModel) pistolModel.visible = false;
            if (sniperModel) sniperModel.visible = false;
            if (shotgunModel) shotgunModel.visible = true;
            
            // Remove shotgun from scene
            villageObjects.forEach(obj => {
                if (obj.userData && obj.userData.type === 'shotgun') {
                    scene.remove(obj);
                }
            });
            
            shotgunAvailable = false;
            
            // Show thank you message
            showThankYouMessage();
        }
    }
    
    // Check for bandages
    bandages.forEach((bandage, index) => {
        if (bandage && bandage.userData.type === 'bandage') {
            const distance = camera.position.distanceTo(bandage.position);
            if (distance < 3 && bandageCount < maxBandages) {
                scene.remove(bandage);
                bandages.splice(index, 1);
                bandageCount++;
                updateBandageDisplay();
                
                // Spawn a new bandage somewhere else
                setTimeout(() => {
                    createNewBandage();
                }, 30000); // 30 seconds
            }
        }
    });
    
    // Check for houses to reload ammo
    houses.forEach(house => {
        const distance = camera.position.distanceTo(house.position);
        if (distance < 5) {
            reload();
            alert('You found ammo in the house!');
        }
    });
}

// Show thank you message
function showThankYouMessage() {
    // Create thank you message element
    const thankYouElement = document.createElement('div');
    thankYouElement.id = 'thankYouMessage';
    thankYouElement.style.position = 'absolute';
    thankYouElement.style.top = '50%';
    thankYouElement.style.left = '50%';
    thankYouElement.style.transform = 'translate(-50%, -50%)';
    thankYouElement.style.color = 'white';
    thankYouElement.style.fontSize = '24px';
    thankYouElement.style.textAlign = 'center';
    thankYouElement.style.zIndex = '100';
    thankYouElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    thankYouElement.style.padding = '20px';
    thankYouElement.style.borderRadius = '10px';
    thankYouElement.style.width = '80%';
    thankYouElement.style.maxWidth = '600px';
    thankYouElement.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.5)';
    thankYouElement.style.animation = 'pulse 2s infinite';
    thankYouElement.innerHTML = `
        <h2 style="color: gold; margin-bottom: 20px; text-shadow: 0 0 10px gold;">Congratulations!</h2>
        <p style="font-size: 28px; color: #FFD700;">You have successfully completed Phase 1!</p>
        <p style="margin: 20px 0;">The powerful shotgun is your reward for defeating the leader dog.</p>
        <p style="font-size: 20px; color: #FFA500;">Use it wisely in your future adventures!</p>
        <p style="margin-top: 30px; font-style: italic; color: #FFD700;">Created by Mohammed Shaker</p>
    `;
    
    // Add pulse animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -50%) scale(1.05); }
            100% { transform: translate(-50%, -50%) scale(1); }
        }
    `;
    document.head.appendChild(style);
    
    // Add to document
    document.body.appendChild(thankYouElement);
    
    // Remove after 10 seconds
    setTimeout(() => {
        if (thankYouElement.parentNode) {
            thankYouElement.parentNode.removeChild(thankYouElement);
        }
        if (style.parentNode) {
            style.parentNode.removeChild(style);
        }
    }, 10000);
}

// Create a new bandage
function createNewBandage() {
    let bandage;
    
    if (bandageModel) {
        bandage = bandageModel.clone();
        bandage.scale.set(0.2, 0.2, 0.2);
    } else {
        // Fallback to simple geometry if model not loaded
        const bandageGeometry = new THREE.BoxGeometry(0.5, 0.2, 0.5);
        const bandageMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFFFFF,
            map: bandageTexture
        });
        bandage = new THREE.Mesh(bandageGeometry, bandageMaterial);
    }
    
    // Random position
    const angle = Math.random() * Math.PI * 2;
    const radius = 20 + Math.random() * 80;
    bandage.position.x = Math.cos(angle) * radius;
    bandage.position.z = Math.sin(angle) * radius;
    bandage.position.y = 0.1;
    
    // Add bandage properties
    bandage.userData = {
        type: 'bandage',
        healAmount: 2 // Heals 2 hearts
    };
    
    bandage.castShadow = true;
    bandage.receiveShadow = true;
    
    scene.add(bandage);
    bandages.push(bandage);
}

// Use bandage to heal
function useBandage() {
    if (bandageCount <= 0) return;
    
    const now = Date.now();
    if (now - lastHealTime < healCooldown) return;
    
    // Heal player
    playerHealth = Math.min(playerHealth + 2, 18);
    updateHealthDisplay();
    
    // Use bandage
    bandageCount--;
    updateBandageDisplay();
    
    // Set cooldown
    lastHealTime = now;
    
    // Visual feedback
    const healthBar = document.getElementById('health');
    healthBar.style.color = '#00FF00';
    setTimeout(() => {
        healthBar.style.color = 'white';
    }, 500);
}

// Reload function
function reload() {
    ammo = 100;
    updateAmmoDisplay();
}

// Update score display
function updateScoreDisplay() {
    document.getElementById('score').textContent = `Score: ${score}`;
}

// Update ammo display
function updateAmmoDisplay() {
    document.getElementById('ammo').textContent = `Ammo: ${ammo}`;
}

// Update health display
function updateHealthDisplay() {
    const healthBar = document.getElementById('health');
    if (healthBar) {
        healthBar.textContent = `Health: ${playerHealth}/${maxHealth}`;
    }
}

// Update bandage display
function updateBandageDisplay() {
    const bandageBar = document.getElementById('bandages');
    if (bandageBar) {
        bandageBar.textContent = `Bandages: ${bandageCount}/${maxBandages}`;
    }
}

// Take damage from dog
function takeDamage(damage) {
    const now = Date.now();
    if (now - lastDogBiteTime < dogBiteCooldown) return; // Check cooldown
    
    lastDogBiteTime = now; // Update last bite time
    playerHealth = Math.max(0, playerHealth - damage); // Ensure health doesn't go below 0
    updateHealthDisplay();
    
    // Visual feedback
    const healthBar = document.getElementById('health');
    healthBar.style.color = '#FF0000';
    setTimeout(() => {
        healthBar.style.color = 'white';
    }, 500);
    
    if (playerHealth <= 0) {
        gameOver = true;
        document.getElementById('finalScore').textContent = score;
        document.getElementById('gameOverScreen').style.display = 'flex';
    }
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Update dog behavior based on game phase
function updateDogBehavior(dog) {
    const now = Date.now();
    const distanceToPlayer = dog.position.distanceTo(camera.position);
    const userData = dog.userData;
    
    // Update dog state based on distance
    if (distanceToPlayer < userData.detectionRange) {
        userData.state = 'aggressive';
    } else if (distanceToPlayer < userData.detectionRange * 1.5) {
        userData.state = 'alert';
    } else {
        userData.state = 'idle';
    }
    
    // Handle different states
    switch (userData.state) {
        case 'idle':
            // Idle behavior - wander around
            if (now - userData.idleTime > userData.idleDuration) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * userData.idleRadius;
                userData.idlePosition.set(
                    userData.idlePosition.x + Math.cos(angle) * radius,
                    0.25,
                    userData.idlePosition.z + Math.sin(angle) * radius
                );
                userData.idleTime = now;
            }
            
            const direction = new THREE.Vector3()
                .subVectors(userData.idlePosition, dog.position)
                .normalize();
            dog.position.add(direction.multiplyScalar(userData.speed * 0.5));
            break;
            
        case 'alert':
            // Alert behavior - move towards player
            const alertDirection = new THREE.Vector3()
                .subVectors(camera.position, dog.position)
                .normalize();
            dog.position.add(alertDirection.multiplyScalar(userData.speed * 0.7));
            break;
            
        case 'aggressive':
            // Chase and bite behavior
            const chaseDirection = new THREE.Vector3()
                .subVectors(camera.position, dog.position)
                .normalize();
            
            // Move towards player
            dog.position.add(chaseDirection.multiplyScalar(userData.speed));
            
            // Bite when close enough and cooldown has passed
            if (distanceToPlayer <= userData.attackRange && now - lastDogBiteTime >= dogBiteCooldown) {
                takeDamage(userData.damage);
                showDamageMessage(`Dog bit you for ${userData.damage} hearts!`);
            }
            break;
    }
    
    // Keep dog on ground
    dog.position.y = 0.25;
    
    // Face movement direction
    if (userData.state !== 'idle') {
        const lookDirection = new THREE.Vector3()
            .subVectors(camera.position, dog.position)
            .normalize();
        dog.rotation.y = Math.atan2(lookDirection.x, lookDirection.z);
    }
}

// Game loop
function animate() {
    animationFrameId = requestAnimationFrame(animate);
    
    if (gameStarted && !gameOver && !gamePaused) {
        // Calculate delta time for smooth movement
        const currentTime = performance.now();
        const deltaTime = (currentTime - lastFrameTime) / 16.67; // Normalize to ~60fps
        lastFrameTime = currentTime;
        
        // Calculate distance traveled
        const currentPosition = camera.position.clone();
        distanceTraveled += currentPosition.distanceTo(lastPosition);
        lastPosition.copy(currentPosition);
        
        // Handle movement
        moveDirection.set(0, 0, 0);
        
        // Get camera's forward and right vectors
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(camera.quaternion);
        forward.y = 0;
        forward.normalize();
        
        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(camera.quaternion);
        right.y = 0;
        right.normalize();
        
        // Calculate movement direction based on camera orientation
        if (moveForward) moveDirection.add(forward);
        if (moveBackward) moveDirection.sub(forward);
        if (moveLeft) moveDirection.sub(right);
        if (moveRight) moveDirection.add(right);
        
        // Normalize movement direction to maintain constant speed (Minecraft style)
        if (moveDirection.length() > 0) {
            moveDirection.normalize();
            
            // Apply sprint multiplier if sprinting
            const currentSpeed = isSprinting ? moveSpeed * sprintMultiplier : moveSpeed;
            
            // Apply movement in world space with delta time for smooth movement
            camera.position.x += moveDirection.x * currentSpeed * deltaTime;
            camera.position.z += moveDirection.z * currentSpeed * deltaTime;
            
            // Update walk cycle for bobbing effect
            walkCycle += bobSpeed * (isSprinting ? 1.5 : 1) * deltaTime;
            const bobOffset = Math.sin(walkCycle) * bobAmount;
            camera.position.y = 1.7 + bobOffset;
        }
        
        // Handle jumping and gravity
        if (isJumping) {
            if (jumpHeight < maxJumpHeight) {
                jumpHeight += jumpSpeed * deltaTime;
                camera.position.y = 1.7 + jumpHeight + (Math.sin(walkCycle) * bobAmount);
            } else {
                isJumping = false;
            }
        } else if (camera.position.y > 1.7) {
            // Apply gravity
            camera.position.y -= gravity * deltaTime;
            if (camera.position.y < 1.7) {
                camera.position.y = 1.7;
            }
        }
        
        // Update exploration time
        if (gamePhase === 0) {
            explorationTime += 16; // Assuming 60fps
            
            // Show exploration progress
            const progress = Math.min(explorationTime / explorationDuration, 1);
            const progressBar = document.getElementById('explorationProgressBar');
            if (progressBar) {
                progressBar.style.width = `${progress * 100}%`;
            }
            
            // Transition to combat phase after exploration duration
            if (explorationTime >= explorationDuration) {
                gamePhase = 1;
                
                // Show combat phase message with pause
                showWarningMessage("The dogs are becoming aggressive! Be careful!");
            }
        }
        
        // Check if boss should spawn
        if (!bossSpawned && distanceTraveled > bossSpawnDistance) {
            createLeaderDog();
            bossSpawned = true;
        }
        
        // Update dog behavior
        dogs.forEach(dog => {
            if (dog.userData.health > 0) {
                updateDogBehavior(dog);
            }
        });
        
        // Update leader dog behavior
        if (leaderDog && leaderDog.userData.health > 0) {
            updateLeaderDogBehavior(leaderDog, deltaTime);
            updateBossHealthBar();
        }
        
        // Animate bandages (make them float slightly)
        bandages.forEach(bandage => {
            if (bandage && bandage.userData.type === 'bandage') {
                bandage.position.y = 0.1 + Math.sin(Date.now() * 0.002) * 0.1;
                bandage.rotation.y += 0.01;
            }
        });
        
        // Check for ammo pickups
        ammoPickups.forEach((ammoPickup, index) => {
            if (ammoPickup && ammoPickup.userData.type === 'ammo') {
                // Animate ammo pickup (float up and down)
                ammoPickup.position.y = ammoPickup.userData.initialY + Math.sin(Date.now() * 0.002 + ammoPickup.userData.floatOffset) * 0.1;
                ammoPickup.rotation.y += 0.01;
                
                // Check if player is close enough to pick up
                const distance = camera.position.distanceTo(ammoPickup.position);
                if (distance < 3) {
                    pickupAmmo(ammoPickup);
                }
            }
        });
        
        // Animate victory stars and fireworks
        if (victoryCelebration) {
            victoryStars.forEach(star => {
                if (star.userData.type === 'firework') {
                    // Update firework particles
                    star.position.add(star.userData.velocity);
                    star.userData.life -= 0.01;
                    star.material.opacity = star.userData.life;
                    
                    // Remove dead particles
                    if (star.userData.life <= 0) {
                        scene.remove(star);
                        victoryStars = victoryStars.filter(s => s !== star);
                    }
                } else {
                    // Original star animation
                    star.position.y = star.userData.initialY + Math.sin(Date.now() * 0.002 + star.userData.floatOffset) * 0.5;
                    star.rotation.x += star.userData.rotateSpeed;
                    star.rotation.y += star.userData.rotateSpeed;
                    const scale = 1 + Math.sin(Date.now() * 0.005) * 0.2;
                    star.scale.set(scale, scale, scale);
                }
            });
            
            // Check if celebration is over
            if (Date.now() - victoryTime > victoryDuration) {
                victoryCelebration = false;
                
                // Remove all victory effects
                victoryStars.forEach(star => {
                    scene.remove(star);
                });
                victoryStars = [];
            }
        }
        
        // Animate shotgun
        if (shotgunAvailable) {
            villageObjects.forEach(obj => {
                if (obj.userData && obj.userData.type === 'shotgun') {
                    // Float up and down
                    obj.position.y = obj.userData.initialY + Math.sin(Date.now() * 0.002 + obj.userData.floatOffset) * 0.2;
                    
                    // Rotate
                    obj.rotation.y += 0.01;
                }
            });
        }
    }
    
    renderer.render(scene, camera);
}

// Clean up resources when game is closed
function cleanup() {
    // Cancel animation frame
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    // Remove event listeners
    document.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    
    // Dispose of Three.js resources
    if (renderer) {
        renderer.dispose();
    }
    
    if (scene) {
        scene.traverse(object => {
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
    }
}

// Create ammo pickups
function createAmmoPickups() {
    // Create 10 ammo pickups scattered around the world
    for (let i = 0; i < 10; i++) {
        const ammoGeometry = new THREE.BoxGeometry(0.5, 0.2, 0.5);
        const ammoMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFFF00,
            roughness: 0.5,
            metalness: 0.5
        });
        const ammoPickup = new THREE.Mesh(ammoGeometry, ammoMaterial);
        
        // Random position
        const angle = Math.random() * Math.PI * 2;
        const radius = 20 + Math.random() * 80;
        ammoPickup.position.x = Math.cos(angle) * radius;
        ammoPickup.position.z = Math.sin(angle) * radius;
        ammoPickup.position.y = 0.1;
        
        // Add ammo properties
        ammoPickup.userData = {
            type: 'ammo',
            ammoAmount: 15 // Each pickup gives 15 ammo
        };
        
        // Add floating animation
        ammoPickup.userData.initialY = ammoPickup.position.y;
        ammoPickup.userData.floatOffset = Math.random() * Math.PI * 2;
        
        ammoPickup.castShadow = true;
        ammoPickup.receiveShadow = true;
        
        scene.add(ammoPickup);
        ammoPickups.push(ammoPickup);
    }
}

// Pick up ammo
function pickupAmmo(ammoPickup) {
    // Add ammo
    ammo += ammoPickup.userData.ammoAmount;
    updateAmmoDisplay();
    
    // Remove ammo pickup
    scene.remove(ammoPickup);
    ammoPickups = ammoPickups.filter(pickup => pickup !== ammoPickup);
    
    // Visual feedback
    const ammoBar = document.getElementById('ammo');
    ammoBar.style.color = '#00FF00';
    setTimeout(() => {
        ammoBar.style.color = 'white';
    }, 500);
    
    // Create a new ammo pickup after some time
    setTimeout(() => {
        createNewAmmoPickup();
    }, 30000); // 30 seconds
}

// Create a new ammo pickup
function createNewAmmoPickup() {
    const ammoGeometry = new THREE.BoxGeometry(0.5, 0.2, 0.5);
    const ammoMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFFFF00,
        roughness: 0.5,
        metalness: 0.5
    });
    const ammoPickup = new THREE.Mesh(ammoGeometry, ammoMaterial);
    
    // Random position
    const angle = Math.random() * Math.PI * 2;
    const radius = 20 + Math.random() * 80;
    ammoPickup.position.x = Math.cos(angle) * radius;
    ammoPickup.position.z = Math.sin(angle) * radius;
    ammoPickup.position.y = 0.1;
    
    // Add ammo properties
    ammoPickup.userData = {
        type: 'ammo',
        ammoAmount: 15 // Each pickup gives 15 ammo
    };
    
    // Add floating animation
    ammoPickup.userData.initialY = ammoPickup.position.y;
    ammoPickup.userData.floatOffset = Math.random() * Math.PI * 2;
    
    ammoPickup.castShadow = true;
    ammoPickup.receiveShadow = true;
    
    scene.add(ammoPickup);
    ammoPickups.push(ammoPickup);
}

// Function to show warning messages with pause
function showWarningMessage(message) {
    // Create warning message element
    const warningElement = document.createElement('div');
    warningElement.id = 'warningMessage';
    warningElement.style.position = 'absolute';
    warningElement.style.top = '20%';
    warningElement.style.left = '50%';
    warningElement.style.transform = 'translate(-50%, -50%)';
    warningElement.style.color = 'white';
    warningElement.style.fontSize = '16px';
    warningElement.style.textAlign = 'center';
    warningElement.style.zIndex = '100';
    warningElement.style.fontWeight = 'bold';
    warningElement.textContent = message;
    
    // Add to document
    document.body.appendChild(warningElement);
    
    // Pause game briefly
    const wasPaused = gamePaused;
    gamePaused = true;
    
    // Remove after 2 seconds
    setTimeout(() => {
        if (warningElement.parentNode) {
            warningElement.parentNode.removeChild(warningElement);
        }
        
        // Resume game if it wasn't paused before
        if (!wasPaused) {
            gamePaused = false;
        }
    }, 2000);
}

// Create victory fireworks
function createVictoryFireworks() {
    // Create 5 firework bursts
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const burstPosition = new THREE.Vector3(
                camera.position.x + (Math.random() - 0.5) * 20,
                5 + Math.random() * 5,
                camera.position.z + (Math.random() - 0.5) * 20
            );
            
            // Create 20 particles per burst
            for (let j = 0; j < 20; j++) {
                const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
                const particleMaterial = new THREE.MeshBasicMaterial({
                    color: new THREE.Color().setHSL(Math.random(), 1, 0.5),
                    transparent: true,
                    opacity: 1
                });
                const particle = new THREE.Mesh(particleGeometry, particleMaterial);
                
                // Random direction
                const direction = new THREE.Vector3(
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.5
                ).normalize();
                
                particle.position.copy(burstPosition);
                particle.userData = {
                    type: 'firework',
                    velocity: direction.multiplyScalar(0.1),
                    life: 1.0
                };
                
                scene.add(particle);
                victoryStars.push(particle);
            }
        }, i * 1000); // Stagger the bursts
    }
}

// Start the game
init();

// Clean up when window is closed
window.addEventListener('unload', cleanup); 

function updateLeaderDogBehavior(dog, deltaTime) {
    const distanceToPlayer = dog.position.distanceTo(camera.position);
    const userData = dog.userData;
    const now = Date.now();
    
    // Update state based on distance
    if (distanceToPlayer > userData.detectionRange) {
        userData.state = 'idle';
    } else if (distanceToPlayer > userData.attackRange) {
        userData.state = 'alert';
    } else {
        userData.state = 'aggressive';
    }
    
    // Handle different states
    switch (userData.state) {
        case 'idle':
            // Idle behavior - patrol around idle position
            userData.idleTime += deltaTime;
            if (userData.idleTime >= userData.idleDuration) {
                const randomAngle = Math.random() * Math.PI * 2;
                userData.idlePosition.set(
                    dog.position.x + Math.cos(randomAngle) * userData.idleRadius,
                    0.25,
                    dog.position.z + Math.sin(randomAngle) * userData.idleRadius
                );
                userData.idleTime = 0;
            }
            
            // Move towards idle position
            const directionToIdle = new THREE.Vector3()
                .subVectors(userData.idlePosition, dog.position)
                .normalize();
            dog.position.add(directionToIdle.multiplyScalar(userData.speed * deltaTime));
            dog.position.y = 0.25;
            break;
            
        case 'alert':
            // Alert behavior - move towards player
            const directionToPlayer = new THREE.Vector3()
                .subVectors(camera.position, dog.position)
                .normalize();
            dog.position.add(directionToPlayer.multiplyScalar(userData.speed * deltaTime));
            dog.position.y = 0.25;
            break;
            
        case 'aggressive':
            // Chase and bite behavior
            const chaseDirection = new THREE.Vector3()
                .subVectors(camera.position, dog.position)
                .normalize();
            
            // Move towards player
            dog.position.add(chaseDirection.multiplyScalar(userData.speed * deltaTime));
            
            // Bite when close enough and cooldown has passed
            if (distanceToPlayer <= userData.attackRange && now - lastDogBiteTime >= dogBiteCooldown) {
                takeDamage(userData.damage);
                showDamageMessage(`Boss dog bit you for ${userData.damage} hearts!`);
            }
            break;
    }
    
    // Keep dog on ground
    dog.position.y = 0.25;
    
    // Make dog face movement direction
    if (dog.position.x !== dog.userData.lastPosition?.x || 
        dog.position.z !== dog.userData.lastPosition?.z) {
        const direction = new THREE.Vector3()
            .subVectors(dog.position, dog.userData.lastPosition || dog.position)
            .normalize();
        dog.rotation.y = Math.atan2(direction.x, direction.z);
    }
    
    // Store last position
    dog.userData.lastPosition = dog.position.clone();
}
