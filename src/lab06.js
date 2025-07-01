import * as THREE from 'three';

// --- Global Variables ---
let scene, camera, renderer;
let sun, planets = []; // Array to hold planet objects
let worldAxesHelper; // This variable is declared but not used in the provided code
let directionalLight;
let ambientLight;

// UI element references
let lookAtXInput, lookAtYInput, lookAtZInput;
let camXInput, camYInput, camZInput;
// let updateCameraButton; // This button ID is not present in your HTML, so it's commented out

// Camera state variables (will be initialized from HTML slider values)
let cameraPosition = new THREE.Vector3(); // Will be set from sliders
let cameraLookAtTarget = new THREE.Vector3(0, 0, 0); // LookAt target remains at the center (Sun)

// --- Helper Functions ---
function updateValue(spanId, value, unit = '') {
    const spanElement = document.getElementById(spanId);
    if (spanElement) {
        spanElement.textContent = `${value}${unit}`;
    }
}

// Helper to create a planet/sun
function createCelestialBody(radius, texturePath, distance, selfRotationSpeed, orbitRotationSpeed, isSun = false) {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(texturePath);
    let material;

    if (isSun) {
        // Sun should appear bright. Use MeshBasicMaterial for a simple glowing effect
        // or MeshStandardMaterial with emissive properties for more advanced lighting.
        material = new THREE.MeshBasicMaterial({ map: texture }); // Sử dụng map: texture
    } else {
        // Planets reflect light, so use MeshPhongMaterial or MeshStandardMaterial
        // MeshPhongMaterial provides specular highlights
        material = new THREE.MeshBasicMaterial({ map: texture }); // Changed to MeshBasicMaterial as in original
    }

    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    const mesh = new THREE.Mesh(geometry, material);

    if (!isSun) {
        // Create an orbit group for the planet (revolves around the sun)
        const orbitGroup = new THREE.Object3D();
        orbitGroup.add(mesh);
        mesh.position.x = distance; // Place the planet at its initial distance from the orbitGroup's center
        mesh.castShadow = true; // Planets cast shadows

        // Store references for animation
        return {
            mesh: mesh,
            orbitGroup: orbitGroup, // This group holds the planet and revolves
            selfRotationSpeed: selfRotationSpeed,
            orbitRotationSpeed: orbitRotationSpeed,
            distance: distance // Store distance for potential future use (e.g., drawing orbits)
        };
    } else {
        mesh.castShadow = false; // Sun does not cast shadow on itself, it is the light source
        return {
            mesh: mesh,
            selfRotationSpeed: selfRotationSpeed,
            isSun: true
        };
    }
}

// --- Three.js Initialization ---
function initThreeJS() {
    // Canvas container will now be the div with ID 'lab06-block-left'
    const canvasContainer = document.getElementById('lab06-block-left');
    if (!canvasContainer) {
        console.error("Element with ID 'lab06-block-left' not found.");
        return;
    }

    // Set width and height directly from a fixed size or dynamically if needed
    const width = 850;
    const height = 550;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf); // Dark background for space, slightly darker than 0xf

    camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 500); // Increased far plane

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
    
    renderer.domElement.style.borderRadius = '5px'; 

    // Append the renderer's DOM element (which is the canvas) directly to the new container
    canvasContainer.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize);

    // Lighting
    // The sun itself will act as the primary light source
    directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // Tăng cường độ sáng của directionalLight
    directionalLight.position.set(30, 20, 10); // Position the light
    scene.add(directionalLight.target); // Adding the target is important for directional light
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 100; // Far enough to cover all planets
    // Adjust frustum for wider shadows. Should cover the entire solar system.
    directionalLight.shadow.camera.left = -60;
    directionalLight.shadow.camera.right = 60;
    directionalLight.shadow.camera.top = 60;
    directionalLight.shadow.camera.bottom = -60;
    scene.add(directionalLight);

    ambientLight = new THREE.AmbientLight(0x888888); // Ambient light, increased slightly for better visibility
    scene.add(ambientLight);

    // Create Solar System Objects
    createSolarSystem();

    // Initialize UI Controls
    initUIControls();

    // After UI is initialized, set camera from initial slider values
    updateCamera(); // Call updateCamera once to apply initial HTML values

    // Start the animation loop
    animate();
}

// Function to create all celestial bodies
function createSolarSystem() {
    // Sun
    sun = createCelestialBody(2, 'img/images_06.jpg', 0, 0.005, 0, true);
    scene.add(sun.mesh);
    // Link the directional light to the sun's position.
    // If the sun moves, the light should move with it.
    // However, since sun.mesh.position is (0,0,0) and the sun doesn't orbit,
    // this line primarily ensures the light target is set if the sun object itself were to be repositioned later.
    directionalLight.target.position.copy(sun.mesh.position); 

    // Planets (radius, texture, distance from sun, self-rotation speed, orbit-rotation speed)
    // Using distinct textures for each planet
    planets.push(createCelestialBody(0.4, 'img/images_01.jpg', 4, 0.02, 0.015));    // Mercury
    planets.push(createCelestialBody(0.8, 'img/images_02.jpg', 7, 0.015, 0.007)); // Venus
    planets.push(createCelestialBody(1, 'img/images_03.jpg', 10, 0.01, 0.005));    // Earth
    planets.push(createCelestialBody(0.6, 'img/images_04.jpg', 13, 0.009, 0.003));    // Mars
    planets.push(createCelestialBody(1.8, 'img/images_05.jpg', 20, 0.008, 0.002)); // Jupiter
    planets.push(createCelestialBody(1.5, 'img/images_01.jpg', 26, 0.007, 0.0015)); // Saturn
    planets.push(createCelestialBody(1.2, 'img/images_02.jpg', 32, 0.006, 0.001)); // Uranus
    planets.push(createCelestialBody(1.1, 'img/images_03.jpg', 38, 0.005, 0.0008)); // Neptune

    // Add planets to the scene via their orbit groups
    planets.forEach(p => {
        scene.add(p.orbitGroup);

        // Draw orbit paths
        const orbitPath = new THREE.EllipseCurve(
            0, 0,          // ax, aY
            p.distance, p.distance, // xRadius, yRadius
            0, 2 * Math.PI, // aStartAngle, aEndAngle
            false,           // aClockwise
            0                // aRotation
        );
        const points = orbitPath.getPoints(100); // 100 segments for smooth curve
        const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x888888 }); // Dim grey orbit line
        const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
        orbitLine.rotation.x = Math.PI / 2; // Rotate to lie on the XZ plane
        scene.add(orbitLine);
    });
}


// Function to initialize UI controls and attach event listeners
function initUIControls() {
    lookAtXInput = document.getElementById('lookAtX');
    lookAtYInput = document.getElementById('lookAtY');
    lookAtZInput = document.getElementById('lookAtZ');
    camXInput = document.getElementById('camX');
    camYInput = document.getElementById('camY');
    camZInput = document.getElementById('camZ');
    // updateCameraButton = document.getElementById('updateCamera'); // This ID is not in your HTML

    // These lines are now primarily for updating the span elements,
    // as the camera will be set from the input values in updateCamera()
    updateValue('lookAtXVal', lookAtXInput.value);
    updateValue('lookAtYVal', lookAtYInput.value);
    updateValue('lookAtZVal', lookAtZInput.value);
    updateValue('camXVal', camXInput.value);
    updateValue('camYVal', camYInput.value);
    updateValue('camZVal', camZInput.value);

    // Add event listeners for direct slider updates
    lookAtXInput.addEventListener('input', updateCamera);
    lookAtYInput.addEventListener('input', updateCamera);
    lookAtZInput.addEventListener('input', updateCamera);
    camXInput.addEventListener('input', updateCamera);
    camYInput.addEventListener('input', updateCamera);
    camZInput.addEventListener('input', updateCamera);

    // If you had an updateCamera button, you would attach its listener here:
    // if (updateCameraButton) {
    //     updateCameraButton.addEventListener('click', updateCamera);
    // }
}

// Function to update camera position and lookAt target based on slider values
function updateCamera() {
    // Update camera position (VRP)
    cameraPosition.x = parseFloat(camXInput.value);
    cameraPosition.y = parseFloat(camYInput.value);
    cameraPosition.z = parseFloat(camZInput.value);
    camera.position.copy(cameraPosition);

    // Update camera lookAt target
    cameraLookAtTarget.x = parseFloat(lookAtXInput.value);
    cameraLookAtTarget.y = parseFloat(lookAtYInput.value);
    cameraLookAtTarget.z = parseFloat(lookAtZInput.value);
    camera.lookAt(cameraLookAtTarget); // Apply the new lookAt target

    // Update displayed values
    updateValue('lookAtXVal', lookAtXInput.value);
    updateValue('lookAtYVal', lookAtYInput.value);
    updateValue('lookAtZVal', lookAtZInput.value);
    updateValue('camXVal', camXInput.value);
    updateValue('camYVal', camYInput.value);
    updateValue('camZVal', camZInput.value);
}

// Function to handle window resizing
function onWindowResize() {
    // Now you get the container directly by ID, as the canvas is nested there
    const canvasContainer = document.getElementById('lab06-block-left');
    if (canvasContainer) {
        // You might want to get width/height from the container's actual dimensions
        // if your layout allows for dynamic resizing.
        // For now, keeping fixed sizes as in your original code.
        const newWidth = 850;
        const newHeight = 550;
        
        if (newWidth > 0 && newHeight > 0) { // Ensure valid dimensions
            renderer.setSize(newWidth, newHeight);
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
        }
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Sun self-rotation
    if (sun) {
        sun.mesh.rotation.y += sun.selfRotationSpeed;
    }

    // Planets self-rotation and orbit rotation
    planets.forEach(p => {
        if (p.mesh && p.orbitGroup) {
            // Planet self-rotation (rotate the mesh directly)
            p.mesh.rotation.y += p.selfRotationSpeed;
            // Planet orbit around the sun
            p.orbitGroup.rotation.y += p.orbitRotationSpeed;
        }
    });

    renderer.render(scene, camera);
}

// Start Three.js initialization when the DOM is ready
document.addEventListener('DOMContentLoaded', initThreeJS);