// lab02.js
"use strict";
/**
 * Hàm điền dữ liệu hình học cho chữ 'N' vào buffer.
 * @param {WebGLRenderingContext} glInstance The WebGL context.
 */
function lab02SetGeometry(glInstance) {
    glInstance.bufferData(
        glInstance.ARRAY_BUFFER,
        new Float32Array([
            // Left vertical bar
            // Triangle 1
            0, 0,
            30, 0,
            0, 150,
            // Triangle 2
            0, 150,
            30, 0,
            30, 150,

            // Right vertical bar
            // Triangle 1
            100, 0,
            130, 0,
            100, 150,
            // Triangle 2
            100, 150,
            130, 0,
            130, 150,

            // Diagonal bar (adjusted for better visual representation)
            // Triangle 1 (top-left to bottom-right of diagonal segment)
            30, 0,      // Top-left of diagonal base
            100, 150,   // Bottom-right of diagonal top
            30, 50,    // Bottom-left of diagonal base (extended down)

            // Triangle 2 (top-right of diagonal segment to bottom-right of diagonal segment)
            30, 0,      // Top-left (same as above)
            100, 100,   // Top-right (slightly thicker diagonal top)
            100, 150,   // Bottom-right (same as above)
        ]),
        glInstance.STATIC_DRAW
    );
}

/**
 * Hàm vẽ cảnh WebGL.
 * Được gọi trong mỗi frame animation.
 * @param {number} time Thời gian hiện tại từ khi bắt đầu animation (tính bằng giây).
 */
function lab02DrawScene(time) {
    // Truy cập các biến trạng thái qua window.lab02State
    const state = window.lab02State;
    if (!state || !state.lab02Gl) return; // Đảm bảo GL context còn tồn tại

    const glInstance = state.lab02Gl;

    // Điều chỉnh kích thước canvas để phù hợp với kích thước hiển thị
    webglUtils.resizeCanvasToDisplaySize(glInstance.canvas);

    // Thiết lập viewport
    glInstance.viewport(0, 0, glInstance.canvas.width, glInstance.canvas.height);

    // Xóa canvas với màu nền trắng
    glInstance.clearColor(1.0, 1.0, 1.0, 1.0);
    glInstance.clear(glInstance.COLOR_BUFFER_BIT);

    // Sử dụng chương trình shader
    glInstance.useProgram(state.lab02Program);

    // Bật thuộc tính vị trí (position attribute)
    glInstance.enableVertexAttribArray(state.lab02PositionLocation);

    // Bind buffer vị trí
    glInstance.bindBuffer(glInstance.ARRAY_BUFFER, state.lab02PositionBuffer);

    // Chỉ định cách đọc dữ liệu từ buffer cho thuộc tính vị trí
    var size = 2;              // 2 component per iteration (x, y)
    var type = glInstance.FLOAT; // The data is 32bit floats
    var normalize = false;   // Don't normalize the data
    var stride = 0;          // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;          // Start at the beginning of the buffer
    glInstance.vertexAttribPointer(
        state.lab02PositionLocation, size, type, normalize, stride, offset);

    // Thiết lập các uniform
    glInstance.uniform2f(state.lab02ResolutionLocation, glInstance.canvas.width, glInstance.canvas.height);
    glInstance.uniform4fv(state.lab02ColorLocation, state.lab02Color);
    glInstance.uniform2fv(state.lab02TranslationLocation, state.lab02Translation);
    glInstance.uniform2fv(state.lab02RotationLocation, state.lab02Rotation);
    glInstance.uniform2fv(state.lab02ScaleLocation, state.lab02Scale);
    glInstance.uniform1f(state.lab02MoveSpeedLocation, state.lab02MoveSpeed);
    glInstance.uniform1f(state.lab02RotateSpeedLocation, state.lab02RotateSpeed);
    glInstance.uniform1f(state.lab02TimeLocation, time);

    // Vẽ hình học
    var primitiveType = glInstance.TRIANGLES;
    var drawOffset = 0;
    var count = 18; // 6 đỉnh cho mỗi hình chữ nhật * 3 hình chữ nhật = 18 đỉnh
    glInstance.drawArrays(primitiveType, drawOffset, count);
}

/**
 * Vòng lặp animation cho Lab02.
 * @param {DOMHighResTimeStamp} now Thời gian hiện tại được truyền bởi requestAnimationFrame.
 */
function lab02Animate(now) {
    const state = window.lab02State;
    if (!state) return; // Đảm bảo trạng thái lab02 tồn tại

    now *= 0.001; // Chuyển từ miligiây sang giây
    state.lab02Then = now; // Cập nhật thời gian cuối cùng

    lab02DrawScene(now); // Vẽ cảnh

    // Yêu cầu frame animation tiếp theo và lưu ID
    state.lab02AnimationFrameId = requestAnimationFrame(lab02Animate);
}

/**
 * Hàm khởi tạo chính cho Lab02.
 * Được gọi từ main.js khi Lab02 được chọn.
 */
window.initLab02 = function () {
    console.log("Initializing Lab 02...");

    // Khởi tạo (hoặc reset) đối tượng trạng thái cho Lab02
    window.lab02State = {
        lab02Gl: null,
        lab02Program: null,
        lab02PositionBuffer: null,
        lab02AnimationFrameId: null, // Để lưu ID của requestAnimationFrame
        lab02Translation: [350, 200],
        lab02Rotation: [0, 1], // [sin(angle), cos(angle)]
        lab02Scale: [1.0, 1.0],
        lab02MoveSpeed: 0.0,
        lab02RotateSpeed: 0.0,
        lab02Color: [0.2, 0.7, 1.0, 1], // Màu xanh lam cố định cho chữ 'N'
        lab02Then: 0, // Biến thời gian cho animation

        // Các biến uniform/attribute locations (được lưu trữ để tránh lookup lại)
        lab02PositionLocation: null,
        lab02ResolutionLocation: null,
        lab02ColorLocation: null,
        lab02TranslationLocation: null,
        lab02RotationLocation: null,
        lab02ScaleLocation: null,
        lab02MoveSpeedLocation: null,
        lab02RotateSpeedLocation: null,
        lab02TimeLocation: null,
    };

    // Kiểm tra webglUtils và hàm loadShader trước khi sử dụng
    if (typeof webglUtils === 'undefined' || typeof webglUtils.loadShader !== 'function') {
        console.error("Error: webglUtils or webglUtils.loadShader is not defined. Ensure webgl-utils.js is loaded correctly.");
        return; // Dừng khởi tạo nếu không có hàm
    }

    const canvas = document.querySelector("#canvas-lab02");
    if (!canvas) {
        console.error("Canvas for Lab02 not found!");
        return;
    }

    // Lấy WebGL context và lưu vào state
    const gl = canvas.getContext("webgl2"); // <-- Định nghĩa biến `gl` ở đây
    window.lab02State.lab02Gl = gl; // <-- Lưu vào state

    if (!gl) { // <-- Kiểm tra biến `gl` đã được định nghĩa
        console.error("WebGL context not available. Please check your browser or device.");
        return;
    }
    console.log("WebGL context obtained for Lab02!");

    const vertexShader = webglUtils.loadShader(gl, window.lab02ShaderSources.VERTEX_SHADER_SOURCE, gl.VERTEX_SHADER);
    const fragmentShader = webglUtils.loadShader(gl, window.lab02ShaderSources.FRAGMENT_SHADER_SOURCE, gl.FRAGMENT_SHADER);


    // THÊM KIỂM TRA LỖI SAU MỖI LẦN GỌI loadShader
    if (!vertexShader || !fragmentShader) {
        console.error("Failed to load one or more shaders. Check console for details.");
        // Không gọi gl.deleteShader(null)
        if (vertexShader) gl.deleteShader(vertexShader); 
        if (fragmentShader) gl.deleteShader(fragmentShader);
        return; 
    }

    // Tạo chương trình GLSL từ các đối tượng shader đã biên dịch
    // Dòng này bị lặp và có lỗi typo 'fungicide'. Sửa lại và chỉ tạo 1 lần.
    window.lab02State.lab02Program = webglUtils.createProgram(gl, [vertexShader, fragmentShader]);
    if (!window.lab02State.lab02Program) {
        console.error('Failed to create WebGL program for Lab02!');
        // Sửa lỗi typo và chỉ xóa shader nếu chúng tồn tại và chương trình không được tạo
        gl.deleteShader(vertexShader); 
        gl.deleteShader(fragmentShader);
        return;
    }
    console.log("WebGL program created for Lab02!");

    // Lookup các vị trí thuộc tính (attribute locations) và uniform locations
    window.lab02State.lab02PositionLocation = gl.getAttribLocation(window.lab02State.lab02Program, "a_position");
    window.lab02State.lab02ResolutionLocation = gl.getUniformLocation(window.lab02State.lab02Program, "u_resolution");
    window.lab02State.lab02ColorLocation = gl.getUniformLocation(window.lab02State.lab02Program, "u_color");
    window.lab02State.lab02TranslationLocation = gl.getUniformLocation(window.lab02State.lab02Program, "u_translation");
    window.lab02State.lab02RotationLocation = gl.getUniformLocation(window.lab02State.lab02Program, "u_rotation");
    window.lab02State.lab02ScaleLocation = gl.getUniformLocation(window.lab02State.lab02Program, "u_scale");
    window.lab02State.lab02MoveSpeedLocation = gl.getUniformLocation(window.lab02State.lab02Program, "u_moveSpeed");
    window.lab02State.lab02RotateSpeedLocation = gl.getUniformLocation(window.lab02State.lab02Program, "u_rotateSpeed");
    window.lab02State.lab02TimeLocation = gl.getUniformLocation(window.lab02State.lab02Program, "u_time");

    // Tạo buffer và điền dữ liệu hình học
    window.lab02State.lab02PositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, window.lab02State.lab02PositionBuffer);
    lab02SetGeometry(gl); // Truyền gl instance

    // Reset các giá trị ban đầu cho một khởi động sạch sẽ (đã được khởi tạo trong window.lab02State)
    // Các hàm cập nhật giá trị cho UI sliders (được định nghĩa cục bộ trong initLab02)
    function updatePosition(index) {
        return function(event, ui) {
            window.lab02State.lab02Translation[index] = ui.value;
        };
    }

    function updateAngle(event, ui) {
        var angleInDegrees = 360 - ui.value;
        var angleInRadians = angleInDegrees * Math.PI / 180;
        window.lab02State.lab02Rotation[0] = Math.sin(angleInRadians);
        window.lab02State.lab02Rotation[1] = Math.cos(angleInRadians);
    }

    function updateScale(index) {
        return function(event, ui) {
            window.lab02State.lab02Scale[index] = ui.value;
        };
    }

    function updateMoveSpeed(event, ui) {
        window.lab02State.lab02MoveSpeed = ui.value;
    }

    function updateRotateSpeed(event, ui) {
        window.lab02State.lab02RotateSpeed = ui.value;
    }

    // Setup UI sliders. webglLessonsUI.setupSlider sẽ tự động tạo input type range nếu chưa có.
    webglLessonsUI.setupSlider("#x", { value: window.lab02State.lab02Translation[0], slide: updatePosition(0), max: canvas.width - 130 });
    webglLessonsUI.setupSlider("#y", { value: window.lab02State.lab02Translation[1], slide: updatePosition(1), max: canvas.height - 150 });
    webglLessonsUI.setupSlider("#angle", { slide: updateAngle, max: 360 });
    webglLessonsUI.setupSlider("#scaleX", { value: window.lab02State.lab02Scale[0], slide: updateScale(0), min: 0.1, max: 2, step: 0.1 });
    webglLessonsUI.setupSlider("#scaleY", { value: window.lab02State.lab02Scale[1], slide: updateScale(1), min: 0.1, max: 2, step: 0.1 });
    webglLessonsUI.setupSlider("#moveSpeed", { value: window.lab02State.lab02MoveSpeed, slide: updateMoveSpeed, min: 0, max: 2, step: 0.1 });
    webglLessonsUI.setupSlider("#rotateSpeed", { value: window.lab02State.lab02RotateSpeed, slide: updateRotateSpeed, min: 0, max: 2, step: 0.1 });

    // Bắt đầu vòng lặp animation
    window.lab02State.lab02AnimationFrameId = requestAnimationFrame(lab02Animate);
};

/**
 * Hàm dọn dẹp cho Lab02.
 * Được gọi từ main.js khi chuyển sang Lab khác.
 */
window.cleanupLab02 = function () {
    console.log("Cleanup function for Lab 02 called.");

    const state = window.lab02State;
    if (!state) { // Nếu state không tồn tại, không cần dọn dẹp
        console.log("Lab02 state not found, no cleanup needed.");
        return;
    }

    // 1. Hủy bỏ animation frame
    if (state.lab02AnimationFrameId) {
        cancelAnimationFrame(state.lab02AnimationFrameId);
        state.lab02AnimationFrameId = null;
        console.log("Animation frame cancelled for Lab02.");
    }

    // 2. Giải phóng các tài nguyên WebGL
    if (state.lab02Gl) {
        if (state.lab02Program) {
            state.lab02Gl.deleteProgram(state.lab02Program);
            state.lab02Program = null;
            console.log("WebGL program deleted for Lab02.");
        }
        if (state.lab02PositionBuffer) {
            state.lab02Gl.deleteBuffer(state.lab02PositionBuffer);
            state.lab02PositionBuffer = null;
            console.log("WebGL position buffer deleted for Lab02.");
        }
    }

    // 3. Dọn dẹp canvas (xóa nội dung hiển thị)
    const canvas = document.querySelector("#canvas-lab02");
    if (canvas) {
        const ctx = canvas.getContext("2d"); // Hoặc WebGL rendering context
        if (ctx) {
            // Đối với WebGL, việc clearColor và clear đủ trong draw, nhưng
            // để đảm bảo canvas sạch sẽ khi chuyển đổi, bạn có thể thực hiện
            // một WebGL clear cuối cùng nếu context còn hoạt động.
            // Nếu bạn có được WebGL context lại ở đây, bạn có thể gọi:
            // const gl = canvas.getContext("webgl");
            // if (gl) {
            //     gl.clearColor(0, 0, 0, 0); // Clear về màu trong suốt
            //     gl.clear(gl.COLOR_BUFFER_BIT);
            // }
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Nếu là context 2D
        }
    }

    // 4. Dọn dẹp các phần tử UI được tạo bởi webgl-lessons-ui
    const uiElements = ["#x", "#y", "#angle", "#scaleX", "#scaleY", "#moveSpeed", "#rotateSpeed"];
    uiElements.forEach(id => {
        const element = document.querySelector(id);
        if (element) {
            element.innerHTML = '';
        }
    });

    // 5. Reset toàn bộ đối tượng trạng thái của Lab02
    window.lab02State = {}; 
    console.log("Lab 02 cleanup complete, state reset.");
};