import * as THREE from 'three';

// Get the container for the Three.js scene
const container = document.getElementById('lab05-block-left');

// Global variables for the Three.js scene and the current 3D object
let currentMesh = null;
let objectAxesHelper = null; // Biến để lưu trữ AxesHelper của đối tượng
let scene, camera, renderer;

// Variables to store references to UI elements
let objectSelect;
let rotationXInput, rotationYInput, rotationZInput;
let scaleXInput, scaleYInput, scaleZInput;
let posXInput, posYInput, posZInput;

// Hàm để cập nhật giá trị hiển thị của các span
function updateValue(spanId, value, unit = '') {
    const spanElement = document.getElementById(spanId);
    if (spanElement) {
        spanElement.textContent = `${value}${unit}`;
    }
}

// Three.js scene initialization function
function initThreeJS() {
    if (!container) {
        console.error("Element with ID 'lab05-block-left' not found.");
        return;
    }

    const width = container.clientWidth || 850;
    const height = container.clientHeight || 550;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 30);
    camera.position.set(5, 7, 5); // Your specified camera position
    camera.lookAt(1, 0, 1);       // Your specified camera look-at target

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true; // Enable shadow maps
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
    container.appendChild(renderer.domElement);

    // Add resize listener
    window.addEventListener('resize', onWindowResize);

    // World Axes Helper - Increased size and moved slightly up to be more visible
    const worldAxesHelper = new THREE.AxesHelper(3); // Increased length to 5
    worldAxesHelper.position.y = 0.01; // Slightly above the plane to prevent Z-fighting
    scene.add(worldAxesHelper);

    // Lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 15, -10); // Moved light position for better shadow coverage
    light.castShadow = true; // Enable light to cast shadows

    // Configure shadow camera for wider coverage
    light.shadow.mapSize.width = 2048; // Higher resolution shadows
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 30; // Increased far plane for wider shadow range
    light.shadow.camera.left = -10; // Wider shadow frustum
    light.shadow.camera.right = 10;
    light.shadow.camera.top = 10;
    light.shadow.camera.bottom = -10;
    scene.add(light);

    // Optional: Add an ambient light for overall scene illumination
    const ambientLight = new THREE.AmbientLight(0x404040); // Soft white ambient light
    scene.add(ambientLight);

    // Ground Plane - Now white
    const planeGeometry = new THREE.PlaneGeometry(100, 100);
    const planeMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide }); // White plane
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true; // Enable plane to receive shadows
    scene.add(plane);

    // Grid Helper - Now more distinct color
    const gridHelper = new THREE.GridHelper(20, 20, 0x666666, 0x666666); // Increased size, changed color to grey for contrast
    gridHelper.position.y = 0.005; // Slightly above the plane to prevent Z-fighting
    scene.add(gridHelper);

    // Initialize UI elements
    objectSelect = document.getElementById('objectSelect');
    rotationXInput = document.getElementById('rotationX');
    rotationYInput = document.getElementById('rotationY');
    rotationZInput = document.getElementById('rotationZ');
    scaleXInput = document.getElementById('scaleX-3D');
    scaleYInput = document.getElementById('scaleY-3D');
    scaleZInput = document.getElementById('scaleZ-3D');
    posXInput = document.getElementById('posX');
    posYInput = document.getElementById('posY');
    posZInput = document.getElementById('posZ');

    // Add event listeners for UI controls
    objectSelect.addEventListener('change', onObjectSelectChange);
    rotationXInput.addEventListener('input', applyTransforms);
    rotationYInput.addEventListener('input', applyTransforms);
    rotationZInput.addEventListener('input', applyTransforms);
    scaleXInput.addEventListener('input', applyTransforms);
    scaleYInput.addEventListener('input', applyTransforms);
    scaleZInput.addEventListener('input', applyTransforms);
    posXInput.addEventListener('input', applyTransforms);
    posYInput.addEventListener('input', applyTransforms);
    posZInput.addEventListener('input', applyTransforms);

    // Initial object and render
    onObjectSelectChange(); // Load the default 'box'
    animate();
}

// Function to handle window resize
function onWindowResize() {
    const newWidth = container.clientWidth || 850;
    const newHeight = container.clientHeight || 550;
    renderer.setSize(newWidth, newHeight);
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
}

// Function to create and return a mesh based on type and random color
function createMesh(type) {
    let geometry;
    let initialOffset = 0; // Offset needed to place base at Y=0

    switch (type) {
        case 'box':
            geometry = new THREE.BoxGeometry(1, 1, 1);
            initialOffset = 0.5; // Half of height
            break;
        case 'sphere':
            geometry = new THREE.SphereGeometry(0.5, 40, 40);
            initialOffset = 0.5; // Radius
            break;
        case 'cone':
            geometry = new THREE.ConeGeometry(0.5, 1, 32);
            initialOffset = 0.5; // Half of height
            break;
        case 'cylinder':
            geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
            initialOffset = 0.5; // Half of height
            break;
        case 'torus':
            geometry = new THREE.TorusGeometry(0.5, 0.2, 16, 50);
            initialOffset = 0; // Torus is centered
            break;
        default:
            geometry = new THREE.BoxGeometry(1, 1, 1);
            initialOffset = 0.5;
            break;
    }

    const material = new THREE.MeshPhongMaterial({ 
        color: new THREE.Color(Math.random(), Math.random(), Math.random()) 
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.name = type; // Gán tên cho mesh để dễ kiểm tra loại đối tượng

    // Áp dụng offset ban đầu để đưa đáy đối tượng về Y=0.
    // Offset này sẽ được đưa vào thuộc tính userData để sử dụng sau này khi scale.
    mesh.userData.initialOffsetY = initialOffset;
    mesh.position.y = initialOffset; // Đặt đối tượng sao cho đáy chạm đất ban đầu

    return mesh;
}

// Event handler when a new object type is selected
function onObjectSelectChange() {
    // Remove previous mesh and its axes helper
    if (currentMesh) {
        scene.remove(currentMesh);
        if (objectAxesHelper) {
            currentMesh.remove(objectAxesHelper); // Remove axes from old mesh
            objectAxesHelper.dispose(); // Dispose axes geometry/material
            objectAxesHelper = null;
        }
        currentMesh.geometry.dispose();
        currentMesh.material.dispose();
        currentMesh = null;
    }

    const selectedType = objectSelect.value;
    currentMesh = createMesh(selectedType);
    scene.add(currentMesh);

    // Add AxesHelper to the current object
    objectAxesHelper = new THREE.AxesHelper(1); // Kích thước trục đối tượng
    currentMesh.add(objectAxesHelper); // Thêm trục đối tượng làm con của đối tượng

    // Reset all transform sliders to default values for the new object
    rotationXInput.value = 0;
    rotationYInput.value = 0;
    rotationZInput.value = 0;
    scaleXInput.value = 1;
    scaleYInput.value = 1;
    scaleZInput.value = 1;
    posXInput.value = 0;
    posYInput.value = 0;
    posZInput.value = 0;

    applyTransforms(); // Apply initial transforms (which are the default resets)
}

// Function to apply transforms from sliders to the current mesh
function applyTransforms() {
    if (!currentMesh) return;

    // Translation (position)
    // Tính toán lại vị trí Y để đáy đối tượng luôn ở Y=0 sau khi scale
    // currentMesh.userData.initialOffsetY là offset ban đầu để đưa đáy về 0
    // Khi scale Y, offset này cũng được scale theo
    const scaledOffsetY = currentMesh.userData.initialOffsetY * currentMesh.scale.y;

    currentMesh.position.x = parseFloat(posXInput.value);
    currentMesh.position.y = parseFloat(posYInput.value) + scaledOffsetY;
    currentMesh.position.z = parseFloat(posZInput.value);

    // Rotation (convert degrees to radians)
    currentMesh.rotation.x = THREE.MathUtils.degToRad(parseFloat(rotationXInput.value));
    currentMesh.rotation.y = THREE.MathUtils.degToRad(parseFloat(rotationYInput.value));
    currentMesh.rotation.z = THREE.MathUtils.degToRad(parseFloat(rotationZInput.value));

    // Scale
    currentMesh.scale.x = parseFloat(scaleXInput.value);
    currentMesh.scale.y = parseFloat(scaleYInput.value);
    currentMesh.scale.z = parseFloat(scaleZInput.value);

    

    // Update displayed values
    updateValue('rotationXVal', rotationXInput.value, '°');
    updateValue('rotationYVal', rotationYInput.value, '°');
    updateValue('rotationZVal', rotationZInput.value, '°');
    updateValue('scaleXVal', scaleXInput.value);
    updateValue('scaleYVal', scaleYInput.value);
    updateValue('scaleZVal', scaleZInput.value);
    updateValue('posXVal', posXInput.value, 'cm');
    updateValue('posYVal', posYInput.value, 'cm');
    updateValue('posZVal', posZInput.value, 'cm');
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Start Three.js initialization when the DOM is ready
document.addEventListener('DOMContentLoaded', initThreeJS);