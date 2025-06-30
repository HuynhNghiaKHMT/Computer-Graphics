import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

let scene, camera, renderer, sphere, controls, gui;
let spotLight1, spotLight2;
let animationFrameId; // Biến để lưu ID của requestAnimationFrame

// Hàm khởi tạo lab, sẽ được gọi từ main.js
export function initLab07() {
  console.log("[lab07.js] Initializing Lab 07.");
  const canvas = document.getElementById("lab07-canvas");
  if (!canvas) {
    console.error("Canvas element with ID 'lab07-canvas' not found!");
    return;
  }

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // Camera
  camera = new THREE.PerspectiveCamera(
    75,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    1000
  );
  camera.position.set(-3, 4, 3);

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Orbit Controls - Vẫn cần để điều khiển camera bằng chuột, chỉ là không hiển thị trên GUI
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 1;
  controls.maxDistance = 10;
  controls.maxPolarAngle = Math.PI / 2;

  // Ground Plane
  const groundGeometry = new THREE.PlaneGeometry(20, 20);
  const textureLoader = new THREE.TextureLoader();
  const groundTexture = textureLoader.load(
    "https://threejs.org/examples/textures/hardwood2_diffuse.jpg"
  );
  groundTexture.wrapS = THREE.RepeatWrapping;
  groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(5, 5);

  const groundMaterial = new THREE.MeshStandardMaterial({
    map: groundTexture,
    roughness: 0.8,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Sphere (the main object)
  const sphereGeometry = new THREE.SphereGeometry(1, 64, 64);
  const sphereMaterial = new THREE.MeshStandardMaterial({
    color: 0x404040,
    metalness: 1.0,
    roughness: 0.2,
    envMap: getReflectionCubeMap(),
  });
  sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.position.y = 1;
  sphere.castShadow = true;
  scene.add(sphere);

  // Spot Light 1
  spotLight1 = new THREE.SpotLight(0xffffff, 1000);
  spotLight1.position.set(-10, 5, -10);
  spotLight1.angle = 0.3;
  spotLight1.penumbra = 1;
  spotLight1.decay = 2;
  spotLight1.distance = 20;
  spotLight1.castShadow = true;
  spotLight1.shadow.mapSize.width = 1024;
  spotLight1.shadow.mapSize.height = 1024;
  spotLight1.shadow.camera.near = 0.1;
  spotLight1.shadow.camera.far = 20;
  spotLight1.shadow.focus = 1;
  scene.add(spotLight1);

  // Spot Light 2
  spotLight2 = new THREE.SpotLight(0xffffff, 1000);
  spotLight2.position.set(10, 5, -10);
  spotLight2.angle = 0.3;
  spotLight2.penumbra = 1;
  spotLight2.decay = 2;
  spotLight2.distance = 20;
  spotLight2.castShadow = true;
  spotLight2.shadow.mapSize.width = 1024;
  spotLight2.shadow.mapSize.height = 1024;
  spotLight2.shadow.camera.near = 0.1;
  spotLight2.shadow.camera.far = 20;
  spotLight2.shadow.focus = 1;
  scene.add(spotLight2);

  // Ambient Light
  const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
  scene.add(ambientLight);

  // GUI for controls
  setupGUI();

  // Handle window resizing
  window.addEventListener("resize", onWindowResize, false);

  // Bắt đầu vòng lặp animate
  animate();
}

// Hàm dọn dẹp lab, sẽ được gọi từ main.js
export function cleanupLab07() {
  console.log("[lab07.js] Cleaning up Lab 07 resources.");
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId); // Dừng vòng lặp animation
  }

  if (gui) {
    gui.destroy(); // Hủy GUI
    gui = null;
  }

  if (renderer) {
    // Không gỡ bỏ canvas khỏi DOM vì nó được tạo trong HTML
    renderer.dispose(); // Giải phóng tài nguyên WebGL của renderer
    renderer = null;
  }

  // Giải phóng tài nguyên của scene
  if (scene) {
    scene.traverse((object) => {
      if (!object.isMesh) return;
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material.dispose();
        }
      }
      // Dispose texture nếu chúng được tạo cục bộ trong cảnh này
      // Lưu ý: textures từ CDN có thể không cần dispose nếu chúng được quản lý bên ngoài
      if (
        object.material &&
        object.material.map &&
        object.material.map.dispose
      ) {
        object.material.map.dispose();
      }
      if (
        object.material &&
        object.material.envMap &&
        object.material.envMap.dispose
      ) {
        object.material.envMap.dispose();
      }
    });
    scene = null;
  }

  if (controls) {
    controls.dispose();
    controls = null;
  }

  camera = null;
  spotLight1 = null;
  spotLight2 = null;
  sphere = null;

  window.removeEventListener("resize", onWindowResize);
}

function getReflectionCubeMap() {
  const cubeTextureLoader = new THREE.CubeTextureLoader();
  const cubeMap = cubeTextureLoader.load([
    "https://threejs.org/examples/textures/cube/Bridge2/posx.jpg",
    "https://threejs.org/examples/textures/cube/Bridge2/negx.jpg",
    "https://threejs.org/examples/textures/cube/Bridge2/posy.jpg",
    "https://threejs.org/examples/textures/cube/Bridge2/negy.jpg",
    "https://threejs.org/examples/textures/cube/Bridge2/posz.jpg",
    "https://threejs.org/examples/textures/cube/Bridge2/negz.jpg",
  ]);
  return cubeMap;
}

function setupGUI() {
  // Khởi tạo GUI với autoPlace: false để kiểm soát vị trí
  if (gui) {
    // Kiểm tra nếu GUI đã tồn tại để tránh tạo lại
    gui.destroy(); // Hủy GUI cũ nếu có
  }
  gui = new GUI({ autoPlace: false });

  const guiContainer = document.getElementById("lab07-gui-container");
  if (guiContainer) {
    // Xóa bất kỳ phần tử GUI cũ nào trong container trước khi thêm cái mới
    // Điều này quan trọng khi chuyển đổi giữa các lab
    while (guiContainer.firstChild) {
      guiContainer.removeChild(guiContainer.firstChild);
    }
    guiContainer.appendChild(gui.domElement); // Thêm GUI vào container đã chỉ định
  } else {
    console.error("GUI container with ID 'lab07-gui-container' not found!");
  }

  // *******************************************************************
  // KHÔNG TẠO FOLDER 'CONTROLS' Ở ĐÂY.
  // Đảm bảo không có dòng nào như:
  // gui.addFolder('Controls');
  // *******************************************************************

  // Material controls
  const materialFolder = gui.addFolder("Vật liệu");
  materialFolder.add(sphere.material, "metalness", 0, 1).name("Độ kim loại");
  materialFolder.add(sphere.material, "roughness", 0, 1).name("Độ nhám");
  materialFolder.open(); // Mở folder này theo mặc định

  // Light 1 controls
  const light1Folder = gui.addFolder("Đèn 1");
  light1Folder.add(spotLight1, "intensity", 0, 2000).name("Cường độ");
  light1Folder.add(spotLight1.position, "x", -10, 10).name("Vị trí X");
  light1Folder.add(spotLight1.position, "y", 0, 10).name("Vị trí Y");
  light1Folder.add(spotLight1.position, "z", -10, 10).name("Vị trí Z");
  light1Folder.add(spotLight1, "angle", 0, Math.PI / 2).name("Góc");
  light1Folder.add(spotLight1, "penumbra", 0, 1).name("Bán nguyệt");
  light1Folder.add(spotLight1.shadow, "focus", 0, 1).name("Tiêu cự bóng");
  light1Folder.open(); // Mở folder này theo mặc định

  // Light 2 controls
  const light2Folder = gui.addFolder("Đèn 2");
  light2Folder.add(spotLight2, "intensity", 0, 2000).name("Cường độ");
  light2Folder.add(spotLight2.position, "x", -10, 10).name("Vị trí X");
  light2Folder.add(spotLight2.position, "y", 0, 10).name("Vị trí Y");
  light2Folder.add(spotLight2.position, "z", -10, 10).name("Vị trí Z");
  light2Folder.add(spotLight2, "angle", 0, Math.PI / 2).name("Góc");
  light2Folder.add(spotLight2, "penumbra", 0, 1).name("Bán nguyệt");
  light2Folder.add(spotLight2.shadow, "focus", 0, 1).name("Tiêu cự bóng");
  light2Folder.open(); // Mở folder này theo mặc định
}

function animate() {
  animationFrameId = requestAnimationFrame(animate);
  controls.update(); // Cập nhật controls ngay cả khi không có GUI cho nó
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

function onWindowResize() {
  const canvas = document.getElementById("lab07-canvas");
  if (canvas && camera && renderer) {
    const parentRect = canvas.parentNode.getBoundingClientRect();
    camera.aspect = parentRect.width / parentRect.height;
    camera.updateProjectionMatrix();
    renderer.setSize(parentRect.width, parentRect.height);
  }
}

// Gán các hàm vào window để main.js có thể gọi chúng
window.initLab07 = initLab07;
window.cleanupLab07 = cleanupLab07;
