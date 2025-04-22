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
let errorRecoveryMode = false; // Flag to track if we're in error recovery mode
let errorRecoveryTimeout = null; // Timeout for error recovery
let performanceMode = false; // Flag for performance mode
let lastPerformanceCheck = 0; // Time of last performance check
let frameCount = 0; // Count frames for performance monitoring
let lastFPSUpdate = 0; // Time of last FPS update
let currentFPS = 0; // Current FPS
let lowPerformanceThreshold = 30; // FPS threshold for low performance
let objectPool = []; // Pool for reusable objects
let maxObjectsInScene = 200; // Maximum number of objects in scene
let garbageCollectionInterval = 30000; // 30 seconds between garbage collection
let lastGarbageCollection = 0; // Time of last garbage collection
let debugMode = false; // Debug mode flag
let errorCount = 0; // Count of errors encountered
let maxErrors = 5; // Maximum number of errors before forcing restart
let lastErrorTime = 0; // Time of last error
let errorResetInterval = 60000; // Reset error count after 1 minute
let criticalError = false; // Flag for critical errors that require immediate action
let errorLog = []; // Array to store recent errors
let maxErrorLogSize = 10; // Maximum number of errors to keep in log
let errorHandlingEnabled = true; // Flag to enable/disable error handling
let autoRecoveryEnabled = true; // Flag to enable/disable automatic recovery
let errorNotificationTimeout = null; // Timeout for error notification
let errorNotificationDuration = 5000; // Duration of error notification in ms

// Load 3D models
const modelLoader = new THREE.GLTFLoader();
let playerModel, dogModel, leaderDogModel, pistolModel, sniperModel, bandageModel;

// Load textures
const blackDogTexture = new THREE.TextureLoader().load('https://cdn.pixabay.com/photo/2016/12/13/05/15/puppy-1903313_960_720.png');
const brownDogTexture = new THREE.TextureLoader().load('https://cdn.pixabay.com/photo/2016/12/13/05/15/puppy-1903313_960_720.png');
const bandageTexture = new THREE.TextureLoader().load('https://cdn.pixabay.com/photo/2017/03/08/14/20/flat-2126884_960_720.png');

// Initialize the game
function init() {
    try {
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
        
        // Initialize performance monitoring
        lastFrameTime = performance.now();
        lastPerformanceCheck = lastFrameTime;
        lastFPSUpdate = lastFrameTime;
        
        // Start game loop
        animate();
        
        // Start garbage collection interval
        setInterval(performGarbageCollection, garbageCollectionInterval);
        
        console.log("Game initialized successfully");
    } catch (error) {
        console.error("Error initializing game:", error);
        showErrorMessage("Failed to initialize game. Please refresh the page.");
    }
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
    try {
        // Create a new leader dog instance
        const leaderDog = new THREE.Group();
        
        // Clone the model if available, otherwise use fallback geometry
        if (leaderDogModel) {
            const model = leaderDogModel.clone();
            model.scale.set(1.5, 1.5, 1.5);
            leaderDog.add(model);
            
            // Set material properties for visibility
            model.traverse((child) => {
                if (child.isMesh) {
                    child.material.depthWrite = false;
                    child.material.depthTest = true;
                    child.material.transparent = true;
                    child.material.opacity = 1;
                    child.renderOrder = 1;
                }
            });
        } else {
            // Fallback geometry if model fails to load
            const geometry = new THREE.BoxGeometry(2, 2, 2);
            const material = new THREE.MeshStandardMaterial({
                color: 0xff0000,
                depthWrite: false,
                depthTest: true,
                transparent: true,
                opacity: 1
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.renderOrder = 1;
            leaderDog.add(mesh);
        }
        
        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(1.2, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.3,
            depthWrite: false
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.renderOrder = 2;
        leaderDog.add(glow);
        
        // Initialize all properties with default values
        leaderDog.userData = {
            type: 'leader',
            health: 30,
            maxHealth: 30,
            speed: 0.15,
            damage: 1.5,
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
            lastBiteTime: 0,
            biteCooldown: 1000,
            idleTime: 0,
            idleDuration: 2000,
            idleRadius: 5,
            idlePosition: new THREE.Vector3(),
            retreatDistance: 3,
            attackPattern: 'bite',
            biteRange: 2.5,
            biteDamage: 2,
            biteDuration: 500,
            isBiting: false,
            lastPosition: new THREE.Vector3(),
            lastUpdateTime: Date.now()
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
        leaderDog.userData.lastPosition.copy(leaderDog.position);
        
        // Add to scene
        scene.add(leaderDog);
        
        // Create boss health bar if it doesn't exist
        if (!document.getElementById('bossHealthContainer')) {
            createBossHealthBar();
        }
        
        return leaderDog;
    } catch (error) {
        console.error('Error creating leader dog:', error);
        handleGameError(error, "leader dog creation");
        return null;
    }
}

// Update leader dog behavior
function updateLeaderDogBehavior(deltaTime) {
    try {
        if (!leaderDog || !leaderDog.userData || gameOver) return;
        
        const leader = leaderDog.userData;
        const distanceToPlayer = leaderDog.position.distanceTo(camera.position);
        const now = Date.now();
        
        // Update detection range based on anger state
        const currentDetectionRange = leader.isAngry ? 35 : 25;
        
        // Check if player is in range
        if (distanceToPlayer <= currentDetectionRange) {
            leader.state = 'aggressive';
            
            // Handle biting attack pattern
            if (leader.attackPattern === 'bite') {
                switch (leader.attackPhase) {
                    case 'approach':
                        // Move towards player
                        const direction = new THREE.Vector3()
                            .subVectors(camera.position, leaderDog.position)
                            .normalize();
                        leaderDog.position.add(direction.multiplyScalar(leader.speed * deltaTime));
                        
                        // Check if close enough to bite
                        if (distanceToPlayer <= leader.biteRange && !leader.isBiting && 
                            now - leader.lastBiteTime >= leader.biteCooldown) {
                            leader.attackPhase = 'bite';
                            leader.isBiting = true;
                            leader.lastBiteTime = now;
                        }
                        break;
                        
                    case 'bite':
                        // Perform bite attack
                        if (distanceToPlayer <= leader.biteRange) {
                            // Deal damage to player
                            takeDamage(leader.biteDamage);
                            
                            // Visual feedback for bite
                            leaderDog.scale.set(1.7, 1.7, 1.7);
                            setTimeout(() => {
                                if (leaderDog && leaderDog.userData) {
                                    leaderDog.scale.set(1.5, 1.5, 1.5);
                                }
                            }, 200);
                        }
                        
                        // After bite duration, move to retreat phase
                        if (now - leader.lastBiteTime >= leader.biteDuration) {
                            leader.attackPhase = 'retreat';
                            leader.isBiting = false;
                        }
                        break;
                        
                    case 'retreat':
                        // Move away from player
                        const retreatDir = new THREE.Vector3()
                            .subVectors(leaderDog.position, camera.position)
                            .normalize();
                        leaderDog.position.add(retreatDir.multiplyScalar(leader.speed * deltaTime));
                        
                        // After retreating enough, go back to approach
                        if (distanceToPlayer >= leader.retreatDistance) {
                            leader.attackPhase = 'approach';
                        }
                        break;
                }
            }
            
            // Update model rotation to face player
            leaderDog.lookAt(camera.position);
            
        } else {
            // Return to idle state if player is out of range
            leader.state = 'idle';
            leader.attackPhase = 'approach';
            leader.isBiting = false;
            
            // Move back to idle position
            const idleDir = new THREE.Vector3()
                .subVectors(leader.idlePosition, leaderDog.position)
                .normalize();
            leaderDog.position.add(idleDir.multiplyScalar(leader.speed * 0.5 * deltaTime));
        }
        
        // Check for becoming angry at half health
        if (!leader.isAngry && leader.health <= leader.maxHealth / 2) {
            leader.isAngry = true;
            leader.speed *= 1.5;
            leader.biteCooldown *= 0.8; // Faster bites when angry
            
            // Visual feedback for becoming angry
            leaderDog.scale.set(1.8, 1.8, 1.8);
            setTimeout(() => {
                if (leaderDog && leaderDog.userData) {
                    leaderDog.scale.set(1.5, 1.5, 1.5);
                }
            }, 500);
        }
        
        // Update last position and time
        leader.lastPosition.copy(leaderDog.position);
        leader.lastUpdateTime = now;
        
    } catch (error) {
        console.error('Error updating leader dog behavior:', error);
        handleGameError(error, "leader dog behavior update");
    }
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
    try {
        // Request next animation frame before doing any work
        animationFrameId = requestAnimationFrame(animate);
        
        // Calculate FPS
        const currentTime = performance.now();
        frameCount++;
        
        // Update FPS counter every second
        if (currentTime - lastFPSUpdate > 1000) {
            currentFPS = Math.round((frameCount * 1000) / (currentTime - lastFPSUpdate));
            frameCount = 0;
            lastFPSUpdate = currentTime;
            
            // Check performance and adjust if needed
            if (currentTime - lastPerformanceCheck > 5000) { // Check every 5 seconds
                checkPerformance();
                lastPerformanceCheck = currentTime;
            }
            
            // Run garbage collection periodically
            if (currentTime - lastGarbageCollection > garbageCollectionInterval) {
                performGarbageCollection();
                lastGarbageCollection = currentTime;
            }
        }
        
        if (!gameStarted || gameOver || gamePaused) {
            renderer.render(scene, camera);
            return;
        }

        // Calculate delta time for smooth movement
        const deltaTime = Math.min((currentTime - lastFrameTime) / 16.67, 2.0); // Cap deltaTime to prevent large jumps
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
            const moveAmount = currentSpeed * deltaTime;
            camera.position.x += moveDirection.x * moveAmount;
            camera.position.z += moveDirection.z * moveAmount;
            
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
            explorationTime += deltaTime * 16; // Scale with deltaTime
            
            // Show exploration progress
            const progress = Math.min(explorationTime / explorationDuration, 1);
            const progressBar = document.getElementById('explorationProgressBar');
            if (progressBar) {
                progressBar.style.width = `${progress * 100}%`;
            }
            
            // Transition to combat phase after exploration duration
            if (explorationTime >= explorationDuration) {
                gamePhase = 1;
                showWarningMessage("The dogs are becoming aggressive! Be careful!");
            }
        }
        
        // Check if boss should spawn
        if (!bossSpawned && distanceTraveled > bossSpawnDistance) {
            try {
                createLeaderDog();
                bossSpawned = true;
            } catch (error) {
                handleGameError(error, "boss spawn");
            }
        }
        
        // Update dog behavior with error handling
        try {
            // Limit the number of dogs to update per frame for performance
            const dogsToUpdate = performanceMode ? 
                dogs.slice(0, Math.min(5, dogs.length)) : 
                dogs;
                
            dogsToUpdate.forEach(dog => {
                if (dog && dog.userData && dog.userData.health > 0) {
                    updateDogBehavior(dog);
                }
            });
            
            // Update leader dog behavior
            if (leaderDog && leaderDog.userData && leaderDog.userData.health > 0) {
                updateLeaderDogBehavior(deltaTime);
                updateBossHealthBar();
            }
        } catch (error) {
            handleGameError(error, "dog behavior update");
        }
        
        // Animate bandages with error handling
        try {
            // Limit the number of bandages to animate per frame for performance
            const bandagesToAnimate = performanceMode ? 
                bandages.slice(0, Math.min(3, bandages.length)) : 
                bandages;
                
            bandagesToAnimate.forEach(bandage => {
                if (bandage && bandage.userData && bandage.userData.type === 'bandage') {
                    bandage.position.y = 0.1 + Math.sin(Date.now() * 0.002) * 0.1;
                    bandage.rotation.y += 0.01;
                }
            });
        } catch (error) {
            handleGameError(error, "bandage animation");
        }
        
        // Check for ammo pickups with error handling
        try {
            // Limit the number of ammo pickups to check per frame for performance
            const ammoPickupsToCheck = performanceMode ? 
                ammoPickups.slice(0, Math.min(3, ammoPickups.length)) : 
                ammoPickups;
                
            ammoPickupsToCheck.forEach(ammoPickup => {
                if (ammoPickup && ammoPickup.userData && ammoPickup.userData.type === 'ammo') {
                    ammoPickup.position.y = ammoPickup.userData.initialY + Math.sin(Date.now() * 0.002 + ammoPickup.userData.floatOffset) * 0.1;
                    ammoPickup.rotation.y += 0.01;
                    
                    const distance = camera.position.distanceTo(ammoPickup.position);
                    if (distance < 3) {
                        pickupAmmo(ammoPickup);
                    }
                }
            });
        } catch (error) {
            handleGameError(error, "ammo pickup check");
        }
        
        // Animate victory effects with error handling
        if (victoryCelebration) {
            try {
                // Limit the number of victory stars to animate per frame for performance
                const starsToAnimate = performanceMode ? 
                    victoryStars.slice(0, Math.min(10, victoryStars.length)) : 
                    victoryStars;
                    
                starsToAnimate.forEach(star => {
                    if (star && star.userData) {
                        if (star.userData.type === 'firework') {
                            star.position.add(star.userData.velocity);
                            star.userData.life -= 0.01;
                            star.material.opacity = star.userData.life;
                            
                            if (star.userData.life <= 0) {
                                scene.remove(star);
                                victoryStars = victoryStars.filter(s => s !== star);
                            }
                        } else {
                            star.position.y = star.userData.initialY + Math.sin(Date.now() * 0.002 + star.userData.floatOffset) * 0.5;
                            star.rotation.x += star.userData.rotateSpeed;
                            star.rotation.y += star.userData.rotateSpeed;
                            const scale = 1 + Math.sin(Date.now() * 0.005) * 0.2;
                            star.scale.set(scale, scale, scale);
                        }
                    }
                });
                
                if (Date.now() - victoryTime > victoryDuration) {
                    victoryCelebration = false;
                    victoryStars.forEach(star => {
                        if (star) scene.remove(star);
                    });
                    victoryStars = [];
                }
            } catch (error) {
                handleGameError(error, "victory effects animation");
            }
        }
        
        // Animate shotgun with error handling
        if (shotgunAvailable) {
            try {
                // Limit the number of objects to check per frame for performance
                const objectsToCheck = performanceMode ? 
                    villageObjects.slice(0, Math.min(5, villageObjects.length)) : 
                    villageObjects;
                    
                objectsToCheck.forEach(obj => {
                    if (obj && obj.userData && obj.userData.type === 'shotgun') {
                        obj.position.y = obj.userData.initialY + Math.sin(Date.now() * 0.002 + obj.userData.floatOffset) * 0.2;
                        obj.rotation.y += 0.01;
                    }
                });
            } catch (error) {
                handleGameError(error, "shotgun animation");
            }
        }
        
        // Render the scene
        try {
            renderer.render(scene, camera);
        } catch (error) {
            handleGameError(error, "scene rendering");
        }
        
        // If we were in error recovery mode and got here, we're recovered
        if (errorRecoveryMode) {
            exitErrorRecoveryMode();
        }
    } catch (error) {
        handleGameError(error, "main game loop");
        
        // If we're already in error recovery mode, don't try again
        if (errorRecoveryMode) {
            return;
        }
        
        // Enter error recovery mode
        enterErrorRecoveryMode();
    }
}

// Function to check performance and adjust settings
function checkPerformance() {
    // If FPS is below threshold, enable performance mode
    if (currentFPS < lowPerformanceThreshold) {
        performanceMode = true;
        console.log("Performance mode enabled due to low FPS:", currentFPS);
        
        // Reduce shadow quality
        if (renderer.shadowMap.enabled) {
            renderer.shadowMap.enabled = false;
        }
        
        // Reduce fog distance
        if (scene.fog) {
            scene.fog.near = 10;
            scene.fog.far = 50;
        }
    } else {
        // If FPS is good, disable performance mode
        performanceMode = false;
        
        // Restore shadow quality
        if (!renderer.shadowMap.enabled) {
            renderer.shadowMap.enabled = true;
        }
        
        // Restore fog distance
        if (scene.fog) {
            scene.fog.near = 20;
            scene.fog.far = 100;
        }
    }
}

// Function to perform garbage collection
function performGarbageCollection() {
    console.log("Running garbage collection...");
    
    // Remove any null or undefined objects from arrays
    dogs = dogs.filter(dog => dog && dog.userData);
    bandages = bandages.filter(bandage => bandage && bandage.userData);
    ammoPickups = ammoPickups.filter(ammo => ammo && ammo.userData);
    villageObjects = villageObjects.filter(obj => obj && obj.userData);
    victoryStars = victoryStars.filter(star => star && star.userData);
    
    // Remove any objects that are no longer in the scene
    dogs = dogs.filter(dog => scene.getObjectById(dog.id));
    bandages = bandages.filter(bandage => scene.getObjectById(bandage.id));
    ammoPickups = ammoPickups.filter(ammo => scene.getObjectById(ammo.id));
    villageObjects = villageObjects.filter(obj => scene.getObjectById(obj.id));
    victoryStars = victoryStars.filter(star => scene.getObjectById(star.id));
    
    // Force garbage collection if available
    if (window.gc) {
        window.gc();
    }
    
    console.log("Garbage collection complete");
}

// Function to show error message
function showErrorMessage(message) {
    const errorElement = document.createElement('div');
    errorElement.style.position = 'absolute';
    errorElement.style.top = '50%';
    errorElement.style.left = '50%';
    errorElement.style.transform = 'translate(-50%, -50%)';
    errorElement.style.color = 'red';
    errorElement.style.fontSize = '20px';
    errorElement.style.textAlign = 'center';
    errorElement.style.zIndex = '1000';
    errorElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    errorElement.style.padding = '20px';
    errorElement.style.borderRadius = '10px';
    errorElement.textContent = message;
    
    document.body.appendChild(errorElement);
    
    setTimeout(() => {
        if (errorElement.parentNode) {
            errorElement.parentNode.removeChild(errorElement);
        }
    }, 5000);
}

// Function to show damage message
function showDamageMessage(message) {
    const damageElement = document.createElement('div');
    damageElement.style.position = 'absolute';
    damageElement.style.top = '30%';
    damageElement.style.left = '50%';
    damageElement.style.transform = 'translate(-50%, -50%)';
    damageElement.style.color = 'red';
    damageElement.style.fontSize = '18px';
    damageElement.style.textAlign = 'center';
    damageElement.style.zIndex = '1000';
    damageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    damageElement.style.padding = '10px';
    damageElement.style.borderRadius = '5px';
    damageElement.textContent = message;
    
    document.body.appendChild(damageElement);
    
    setTimeout(() => {
        if (damageElement.parentNode) {
            damageElement.parentNode.removeChild(damageElement);
        }
    }, 2000);
}

// Clean up resources when game is closed
function cleanup() {
    try {
        // Cancel animation frame
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        
        // Clear any error recovery timeout
        if (errorRecoveryTimeout) {
            clearTimeout(errorRecoveryTimeout);
            errorRecoveryTimeout = null;
        }
        
        // Clear any error notification timeout
        if (errorNotificationTimeout) {
            clearTimeout(errorNotificationTimeout);
            errorNotificationTimeout = null;
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
    } catch (error) {
        console.error('Error during cleanup:', error);
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

function handleGameError(error, context) {
    if (!errorHandlingEnabled) return;
    
    const now = Date.now();
    const errorInfo = {
        message: error.message || 'Unknown error',
        stack: error.stack,
        context: context,
        time: now
    };
    
    // Add to error log
    errorLog.push(errorInfo);
    if (errorLog.length > maxErrorLogSize) {
        errorLog.shift(); // Remove oldest error
    }
    
    // Increment error count
    errorCount++;
    lastErrorTime = now;
    
    // Log error to console
    console.error(`Error in ${context}:`, error);
    
    // Show error notification to user
    showErrorNotification(`Error in ${context}: ${error.message}`);
    
    // Check if we've hit the error threshold
    if (errorCount >= maxErrors) {
        criticalError = true;
        showErrorMessage("Too many errors detected. Game will restart in 5 seconds.");
        
        // Force restart after 5 seconds
        setTimeout(() => {
            restartGame();
            errorCount = 0;
            criticalError = false;
        }, 5000);
    }
    
    // Reset error count after interval if no new errors
    if (now - lastErrorTime > errorResetInterval) {
        errorCount = 0;
    }
    
    // Enter error recovery mode if auto-recovery is enabled
    if (autoRecoveryEnabled && !errorRecoveryMode) {
        enterErrorRecoveryMode();
    }
}

// Function to show error notification
function showErrorNotification(message) {
    // Clear any existing notification timeout
    if (errorNotificationTimeout) {
        clearTimeout(errorNotificationTimeout);
    }
    
    // Create notification element
    const notificationElement = document.createElement('div');
    notificationElement.id = 'errorNotification';
    notificationElement.style.position = 'absolute';
    notificationElement.style.top = '10%';
    notificationElement.style.left = '50%';
    notificationElement.style.transform = 'translate(-50%, -50%)';
    notificationElement.style.color = 'white';
    notificationElement.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
    notificationElement.style.padding = '10px';
    notificationElement.style.borderRadius = '5px';
    notificationElement.style.fontSize = '14px';
    notificationElement.style.zIndex = '1000';
    notificationElement.style.maxWidth = '80%';
    notificationElement.style.textAlign = 'center';
    notificationElement.textContent = message;
    
    // Add to document
    document.body.appendChild(notificationElement);
    
    // Remove after duration
    errorNotificationTimeout = setTimeout(() => {
        if (notificationElement.parentNode) {
            notificationElement.parentNode.removeChild(notificationElement);
        }
    }, errorNotificationDuration);
}

// Function to enter error recovery mode
function enterErrorRecoveryMode() {
    if (errorRecoveryMode) return;
    
    errorRecoveryMode = true;
    console.log("Entering error recovery mode");
    
    // Pause the game
    if (!gamePaused) {
        gamePaused = true;
        controls.unlock();
        
        // Show recovery message
        showErrorMessage("Game paused for error recovery. Resuming in 3 seconds...");
        
        // Set a timeout to automatically resume
        errorRecoveryTimeout = setTimeout(() => {
            exitErrorRecoveryMode();
        }, 3000);
    }
}

// Function to exit error recovery mode
function exitErrorRecoveryMode() {
    if (!errorRecoveryMode) return;
    
    errorRecoveryMode = false;
    console.log("Exiting error recovery mode");
    
    // Resume the game
    if (gamePaused) {
        gamePaused = false;
        controls.lock();
    }
    
    // Clear any existing timeout
    if (errorRecoveryTimeout) {
        clearTimeout(errorRecoveryTimeout);
        errorRecoveryTimeout = null;
    }
}
