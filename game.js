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
let playerHealth = 10; // 10 hearts
let currentWeapon = 'pistol';
let powerUpAvailable = false;
let powerUpPosition = new THREE.Vector3();
let lastAttackTime = 0;
let attackCooldown = 1000; // 1 second cooldown between dog attacks
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
    for (let i = 0; i < 10; i++) {
        let dog;
        
        if (dogModel) {
            dog = dogModel.clone();
            dog.scale.set(0.3, 0.3, 0.3); // Make dogs smaller
        } else {
            // Fallback to simple geometry if model not loaded
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
        dog.position.y = 0.25; // Lower to the ground
        
        // Add dog properties
        dog.userData = {
            health: 100,
            speed: 0.03 + Math.random() * 0.02,
            type: Math.random() < 0.5 ? 'black' : 'brown',
            lastAttackTime: 0,
            attackCooldown: 1000 + Math.random() * 500, // 1-1.5 seconds
            damage: 0.5, // Half a heart
            attackRange: 1.5 + Math.random() * 0.5, // 1.5-2 units
            state: 'idle', // idle, alert, aggressive
            detectionRange: 10 + Math.random() * 5, // 10-15 units
            idleTime: 0,
            idleDuration: 2000 + Math.random() * 3000, // 2-5 seconds
            idlePosition: new THREE.Vector3().copy(dog.position),
            idleRadius: 2 + Math.random() * 3, // 2-5 units
            isJumping: false,
            jumpHeight: 0,
            maxJumpHeight: 1.5,
            jumpSpeed: 0.1,
            jumpCooldown: 2000, // 2 seconds between jumps
            lastJumpTime: 0,
            attackPhase: 'approach' // approach, jump, attack, retreat
        };
        
        dog.castShadow = true;
        dog.receiveShadow = true;
        
        scene.add(dog);
        dogs.push(dog);
    }
}

// Create leader dog
function createLeaderDog() {
    let leader;
    
    if (leaderDogModel) {
        leader = leaderDogModel.clone();
        leader.scale.set(1.5, 1.5, 1.5); // Make leader dog much larger
    } else {
        // Fallback to simple geometry if model not loaded
        const leaderGeometry = new THREE.BoxGeometry(2, 2, 4);
        const leaderMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            map: brownDogTexture
        });
        leader = new THREE.Mesh(leaderGeometry, leaderMaterial);
    }
    
    // Position leader dog
    const angle = Math.random() * Math.PI * 2;
    const radius = 30;
    leader.position.x = Math.cos(angle) * radius;
    leader.position.z = Math.sin(angle) * radius;
    leader.position.y = 1; // Higher off the ground to make it more visible
    
    // Add leader properties
    leader.userData = {
        health: 20, // 20 hearts
        maxHealth: 20,
        speed: 0.04,
        type: 'leader',
        lastAttackTime: 0,
        attackCooldown: 800, // 0.8 seconds
        damage: 1.5, // 1.5 hearts
        phase: 1, // 1: normal, 2: angry
        isAngry: false,
        attackRange: 2.5, // 2.5 units
        state: 'idle', // idle, alert, aggressive
        detectionRange: 15, // 15 units
        idleTime: 0,
        idleDuration: 3000 + Math.random() * 2000, // 3-5 seconds
        idlePosition: new THREE.Vector3().copy(leader.position),
        idleRadius: 3 + Math.random() * 2, // 3-5 units
        isJumping: false,
        jumpHeight: 0,
        maxJumpHeight: 2.5,
        jumpSpeed: 0.15,
        jumpCooldown: 1500, // 1.5 seconds between jumps
        lastJumpTime: 0,
        attackPhase: 'approach' // approach, jump, attack, retreat
    };
    
    leader.castShadow = true;
    leader.receiveShadow = true;
    
    scene.add(leader);
    leaderDog = leader;
    
    // Show boss alert with pause
    showWarningMessage("Warning: The boss dog has appeared! It is stronger and faster than regular dogs.");
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
    playerHealth = 10;
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
    playerHealth = 10;
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
    
    const speed = 0.2;
    const moveDirection = new THREE.Vector3();
    
    // Track which keys are currently pressed
    if (!window.keysPressed) {
        window.keysPressed = {};
    }
    window.keysPressed[event.code] = true;
    
    // Calculate movement direction based on all currently pressed keys
    if (window.keysPressed['KeyW']) moveDirection.z -= 1;
    if (window.keysPressed['KeyS']) moveDirection.z += 1;
    if (window.keysPressed['KeyA']) moveDirection.x -= 1;
    if (window.keysPressed['KeyD']) moveDirection.x += 1;
    
    // Normalize and apply movement
    if (moveDirection.length() > 0) {
        moveDirection.normalize();
        moveDirection.multiplyScalar(speed);
        
        // Apply movement in world space
        camera.position.x += moveDirection.x;
        camera.position.z += moveDirection.z;
    }
    
    // Handle other keys
    switch (event.code) {
        case 'Space':
            if (!isJumping) {
                isJumping = true;
                jumpHeight = 0;
            }
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
    // Handle key release events
    if (window.keysPressed) {
        window.keysPressed[event.code] = false;
    }
    
    switch (event.code) {
        case 'Escape':
            // Prevent default behavior (browser menu)
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
            
            if (currentWeapon === 'pistol') {
                // Regular pistol: 3 hits = 1 heart
                if (bossHitCount % 3 === 0) {
                    hitDog.userData.health -= 1;
                }
            } else if (currentWeapon === 'sniper') {
                // Sniper rifle: 1 hit = 1 heart
                hitDog.userData.health -= 1;
            }
            
            // Check if leader dog is at half health
            if (!hitDog.userData.isAngry && hitDog.userData.health <= hitDog.userData.maxHealth / 2) {
                hitDog.userData.isAngry = true;
                hitDog.userData.phase = 2;
                hitDog.userData.damage = 2.5; // 2.5 hearts
                hitDog.userData.speed = 0.06; // Faster
                
                // Spawn power-up
                spawnPowerUp();
                
                // Show warning with pause
                showWarningMessage("The leader dog is getting angry! A new weapon has appeared!");
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
                gameOver = true;
                document.getElementById('finalScore').textContent = score;
                document.getElementById('gameOverScreen').style.display = 'flex';
                showWarningMessage("You won! You defeated the leader dog!");
            } else {
                scene.remove(hitDog);
                dogs = dogs.filter(dog => dog !== hitDog);
                score += 10;
                updateScoreDisplay();
            }
        }
    }
}

// Spawn power-up
function spawnPowerUp() {
    powerUpAvailable = true;
    
    // Position power-up near the player
    const angle = Math.random() * Math.PI * 2;
    const radius = 5;
    powerUpPosition.set(
        camera.position.x + Math.cos(angle) * radius,
        0.5,
        camera.position.z + Math.sin(angle) * radius
    );
    
    // Create power-up object
    const powerUpGeometry = new THREE.BoxGeometry(1, 1, 1);
    const powerUpMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFF00 });
    const powerUp = new THREE.Mesh(powerUpGeometry, powerUpMaterial);
    powerUp.position.copy(powerUpPosition);
    powerUp.userData = { type: 'sniper' };
    
    powerUp.castShadow = true;
    powerUp.receiveShadow = true;
    
    scene.add(powerUp);
    villageObjects.push(powerUp);
}

// Pick up power-up
function pickupPowerUp() {
    if (!powerUpAvailable) return;
    
    // Check if player is close to power-up
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
    playerHealth = Math.min(playerHealth + 2, 10);
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
        healthBar.textContent = `Health: ${playerHealth}/10`;
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
    playerHealth -= damage;
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
    const distance = camera.position.distanceTo(dog.position);
    
    // Check if dog is in detection range
    if (distance < dog.userData.detectionRange) {
        // Dog becomes alert
        if (dog.userData.state === 'idle') {
            dog.userData.state = 'alert';
            
            // Visual feedback - dog turns yellow
            const originalColor = dog.material.color.getHex();
            dog.material.color.set(0xFFFF00);
            setTimeout(() => {
                dog.material.color.set(originalColor);
            }, 500);
        }
        
        // If dog is alert and player is close, become aggressive
        if (dog.userData.state === 'alert' && distance < dog.userData.detectionRange * 0.5) {
            dog.userData.state = 'aggressive';
            
            // Visual feedback - dog turns red
            const originalColor = dog.material.color.getHex();
            dog.material.color.set(0xFF0000);
            setTimeout(() => {
                dog.material.color.set(originalColor);
            }, 500);
        }
    } else {
        // Dog returns to idle if player is far away
        if (dog.userData.state !== 'idle') {
            dog.userData.state = 'idle';
            
            // Visual feedback - dog returns to normal color
            const originalColor = dog.material.color.getHex();
            dog.material.color.set(originalColor);
        }
    }
    
    // Handle dog movement based on state
    switch (dog.userData.state) {
        case 'idle':
            // Idle behavior - wander around
            dog.userData.idleTime += 16; // Assuming 60fps
            
            if (dog.userData.idleTime > dog.userData.idleDuration) {
                // Choose new idle position
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * dog.userData.idleRadius;
                dog.userData.idlePosition.set(
                    dog.userData.idlePosition.x + Math.cos(angle) * radius,
                    dog.userData.idlePosition.y,
                    dog.userData.idlePosition.z + Math.sin(angle) * radius
                );
                
                // Reset idle time
                dog.userData.idleTime = 0;
            }
            
            // Move towards idle position
            const direction = new THREE.Vector3();
            direction.subVectors(dog.userData.idlePosition, dog.position).normalize();
            dog.position.add(direction.multiplyScalar(dog.userData.speed * 0.5));
            
            // Make dog face movement direction
            if (direction.length() > 0) {
                dog.lookAt(dog.position.clone().add(direction));
            }
            break;
            
        case 'alert':
            // Alert behavior - face player but don't move
            dog.lookAt(camera.position);
            break;
            
        case 'aggressive':
            // Aggressive behavior - chase and attack player with jumping attacks
            const now = Date.now();
            
            // Handle jumping attack behavior
            if (dog.userData.attackPhase === 'approach') {
                // Approach the player
                const chaseDirection = new THREE.Vector3();
                chaseDirection.subVectors(camera.position, dog.position).normalize();
                dog.position.add(chaseDirection.multiplyScalar(dog.userData.speed));
                
                // Make dog face the player
                dog.lookAt(camera.position);
                
                // Check if close enough to jump
                if (distance < dog.userData.attackRange * 1.5 && 
                    now - dog.userData.lastJumpTime > dog.userData.jumpCooldown) {
                    dog.userData.attackPhase = 'jump';
                    dog.userData.isJumping = true;
                    dog.userData.jumpHeight = 0;
                    dog.userData.lastJumpTime = now;
                }
            } 
            else if (dog.userData.attackPhase === 'jump') {
                // Jumping phase
                if (dog.userData.isJumping) {
                    if (dog.userData.jumpHeight < dog.userData.maxJumpHeight) {
                        // Jump up
                        dog.userData.jumpHeight += dog.userData.jumpSpeed;
                        dog.position.y += dog.userData.jumpSpeed;
                    } else {
                        // Start falling
                        dog.userData.isJumping = false;
                    }
                } else {
                    // Falling phase
                    dog.position.y -= dog.userData.jumpSpeed;
                    
                    // Check if landed
                    if (dog.position.y <= 0.25) {
                        dog.position.y = 0.25;
                        dog.userData.attackPhase = 'attack';
                    }
                }
            }
            else if (dog.userData.attackPhase === 'attack') {
                // Attack phase - check if close enough to bite
                if (distance < dog.userData.attackRange) {
                    const attackNow = Date.now();
                    if (attackNow - dog.userData.lastAttackTime > dog.userData.attackCooldown) {
                        takeDamage(dog.userData.damage);
                        dog.userData.lastAttackTime = attackNow;
                        
                        // Visual feedback for attack
                        const originalColor = dog.material.color.getHex();
                        dog.material.color.set(0xFF0000);
                        setTimeout(() => {
                            dog.material.color.set(originalColor);
                        }, 100);
                    }
                }
                
                // Move to retreat phase
                dog.userData.attackPhase = 'retreat';
            }
            else if (dog.userData.attackPhase === 'retreat') {
                // Retreat phase - move away from player
                const retreatDirection = new THREE.Vector3();
                retreatDirection.subVectors(dog.position, camera.position).normalize();
                dog.position.add(retreatDirection.multiplyScalar(dog.userData.speed * 0.7));
                
                // After retreating, go back to approach phase
                if (distance > dog.userData.attackRange * 2) {
                    dog.userData.attackPhase = 'approach';
                }
            }
            break;
    }
}

// Game loop
function animate() {
    animationFrameId = requestAnimationFrame(animate);
    
    if (gameStarted && !gameOver && !gamePaused) {
        // Calculate distance traveled
        const currentPosition = camera.position.clone();
        distanceTraveled += currentPosition.distanceTo(lastPosition);
        lastPosition.copy(currentPosition);
        
        // Handle jumping
        if (isJumping) {
            if (jumpHeight < maxJumpHeight) {
                jumpHeight += jumpSpeed;
                camera.position.y += jumpSpeed;
            } else {
                isJumping = false;
            }
        } else if (camera.position.y > 1.7) {
            // Apply gravity
            camera.position.y -= gravity;
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
            updateDogBehavior(leaderDog);
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

// Start the game
init();

// Clean up when window is closed
window.addEventListener('unload', cleanup); 
