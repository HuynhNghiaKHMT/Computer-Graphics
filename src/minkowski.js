// src/minkowski.js
// Định nghĩa đối tượng toàn cục cho Đảo Minkowski
window.minkowskiIsland = {
    gl: null,
    program: null,
    vertices: [],
    level: 0,
    u_scaleXLoc: null, // Thêm biến để lưu trữ vị trí uniform cho scale X
    u_scaleYLoc: null, // Thêm biến để lưu trữ vị trí uniform cho scale Y

    /**
     * Hàm kiểm tra lỗi biên dịch shader.
     * @param {WebGLShader} shader - Shader cần kiểm tra.
     */
    checkShaderCompile: function(shader) {
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const error = this.gl.getShaderInfoLog(shader);
            console.error("Lỗi biên dịch Shader:", error);
            showCustomAlert(`Lỗi biên dịch Shader: ${error}`, "Lỗi Shader");
        }
    },

    /**
     * Hàm kiểm tra lỗi liên kết chương trình shader.
     * @param {WebGLProgram} program - Chương trình shader cần kiểm tra.
     */
    checkProgramLink: function(program) {
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            const error = this.gl.getProgramInfoLog(program);
            console.error("Lỗi liên kết chương trình:", error);
            showCustomAlert(`Lỗi liên kết chương trình: ${error}`, "Lỗi Shader");
        }
    },

    /**
     * Khởi tạo WebGL context và các shader.
     * @param {WebGLRenderingContext} glContext - Ngữ cảnh WebGL được truyền từ lab04.js.
     */
    init: function(glContext) {
        console.log("[minkowskiIsland] Bắt đầu khởi tạo.");
        this.gl = glContext;
        if (!this.gl) {
            showCustomAlert("Ngữ cảnh WebGL không hợp lệ.", "Lỗi WebGL");
            console.error("[minkowskiIsland] Ngữ cảnh WebGL không hợp lệ.");
            return;
        }
        console.log("[minkowskiIsland] Ngữ cảnh WebGL hợp lệ.");
        console.log("[minkowskiIsland] gl.isContextLost():", this.gl.isContextLost());

        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        console.log(`[minkowskiIsland] Viewport đã đặt thành: ${this.gl.canvas.width}x${this.gl.canvas.height}`);
        this.gl.clearColor(1, 1, 1, 1); // Màu nền trắng
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        console.log("[minkowskiIsland] Đã xóa canvas.");
        
        this.initShaders();
        console.log("[minkowskiIsland] Đã khởi tạo shader.");
    },

    /**
     * Khởi tạo các shader (Vertex Shader và Fragment Shader) cho WebGL.
     */
    initShaders: function() {
        const vsSource = `
            attribute vec2 coordinates;
            uniform float u_scaleX; // Thêm uniform cho scale X
            uniform float u_scaleY; // Thêm uniform cho scale Y

            void main() {
                // Áp dụng scaling cho cả X và Y
                gl_Position = vec4(coordinates.x * u_scaleX, coordinates.y * u_scaleY, 0.0, 1.0);
            }
        `;
        const fsSource = `
            precision mediump float; // Thêm precision qualifier
            void main() {
                gl_FragColor = vec4(0.027, 0.616, 0.851, 1.0); // Màu xanh dương
            }
        `;
        
        const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
        this.gl.shaderSource(vertexShader, vsSource);
        this.gl.compileShader(vertexShader);
        this.checkShaderCompile(vertexShader);
        
        const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        this.gl.shaderSource(fragmentShader, fsSource);
        this.gl.compileShader(fragmentShader);
        this.checkShaderCompile(fragmentShader);
        
        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);
        this.checkProgramLink(this.program);
        this.gl.useProgram(this.program);
        console.log("[minkowskiIsland] Shader đã được sử dụng.");

        // Lấy vị trí của các uniform mới
        this.u_scaleXLoc = this.gl.getUniformLocation(this.program, "u_scaleX");
        this.u_scaleYLoc = this.gl.getUniformLocation(this.program, "u_scaleY");
        if (!this.u_scaleXLoc || !this.u_scaleYLoc) {
            console.warn("[minkowskiIsland] Không tìm thấy uniform u_scaleX hoặc u_scaleY.");
        }
    },

    /**
     * Tạo các điểm đỉnh cho Đường cong Minkowski.
     * Bắt đầu với một hình vuông và áp dụng quy tắc Minkowski đệ quy cho mỗi cạnh.
     * @param {number} currentLevel - Mức độ đệ quy hiện tại.
     */
    generateMinkowskiCurve: function(currentLevel) {
        this.vertices = [];
        let points = [
            [-0.5, 0.5], [0.5, 0.5],
            [0.5, -0.5], [-0.5, -0.5]
        ];
        for (let i = 0; i < points.length; i++) {
            this.generateMinkowskiSegment(points[i], points[(i + 1) % points.length], currentLevel);
        }
        console.log(`[minkowskiIsland] Đã tạo ${this.vertices.length / 2} điểm đỉnh cho level ${currentLevel}.`);
    },

    /**
     * Tạo một đoạn Minkowski đệ quy.
     * @param {number[]} p1 - Điểm bắt đầu của đoạn [x, y].
     * @param {number[]} p2 - Điểm kết thúc của đoạn [x, y].
     * @param {number} depth - Mức độ đệ quy hiện tại.
     */
    generateMinkowskiSegment: function(p1, p2, depth) {
        if (depth === 0) {
            this.vertices.push(...p1, ...p2);
            return;
        }
        
        let dx = p2[0] - p1[0];
        let dy = p2[1] - p1[1];
        let delta = Math.sqrt(dx * dx + dy * dy) / 4;
        
        let dirX = Math.sign(dx);
        let dirY = Math.sign(dy);

        let C = [p1[0] + dirX * delta, p1[1] + dirY * delta];
        let D = [C[0] + dirX * delta, C[1] + dirY * delta];
        let E = [D[0] + dirX * delta, D[1] + dirY * delta];
        
        let F = [C[0] - dirY * delta, C[1] + dirX * delta];
        let G = [D[0] - dirY * delta, D[1] + dirX * delta];
        let H = [D[0] + dirY * delta, D[1] - dirX * delta];
        let I = [E[0] + dirY * delta, E[1] - dirX * delta];

        let segments = [p1, C, F, G, D, H, I, E, p2];
        for (let i = 0; i < segments.length - 1; i++) {
            this.generateMinkowskiSegment(segments[i], segments[i + 1], depth - 1);
        }
    },

    /**
     * Vẽ Đường cong Minkowski lên canvas WebGL.
     */
    draw: function() {
        console.log("[minkowskiIsland] Bắt đầu vẽ.");
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.generateMinkowskiCurve(this.level);
        
        const canvasWidth = this.gl.canvas.width;
        const canvasHeight = this.gl.canvas.height;
        const aspectRatio = canvasWidth / canvasHeight;

        let scaleX = 1.0;
        let scaleY = 1.0;

        // Điều chỉnh scaling để giữ tỉ lệ vuông của hình vẽ trong canvas hình chữ nhật
        if (aspectRatio > 1) { // Canvas rộng hơn cao (ví dụ: 850x550)
            scaleX = canvasHeight / canvasWidth; // Thu nhỏ chiều ngang của hình
            scaleY = 1.0; // Giữ nguyên chiều dọc
        } else if (aspectRatio < 1) { // Canvas cao hơn rộng (ví dụ: 550x850)
            scaleX = 1.0; // Giữ nguyên chiều ngang
            scaleY = canvasWidth / canvasHeight; // Thu nhỏ chiều dọc của hình
        }
        // Nếu aspectRatio == 1 (hình vuông), cả scaleX và scaleY đều là 1.0

        if (this.u_scaleXLoc && this.u_scaleYLoc) {
            this.gl.uniform1f(this.u_scaleXLoc, scaleX);
            this.gl.uniform1f(this.u_scaleYLoc, scaleY);
        }
        
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.STATIC_DRAW);
        
        const coord = this.gl.getAttribLocation(this.program, "coordinates");
        this.gl.vertexAttribPointer(coord, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(coord);
        
        this.gl.drawArrays(this.gl.LINE_STRIP, 0, this.vertices.length / 2);
        const error = this.gl.getError();
        if (error !== this.gl.NO_ERROR) {
            console.error("[minkowskiIsland] Lỗi WebGL sau khi drawArrays:", error);
            showCustomAlert(`Lỗi WebGL trong quá trình vẽ: ${error}`, "Lỗi WebGL");
        }
        console.log("[minkowskiIsland] Đã hoàn tất vẽ.");
    },

    /**
     * Thay đổi mức độ đệ quy của Đường cong Minkowski và vẽ lại.
     * @param {number} delta - Giá trị thay đổi mức độ (-1 để giảm, 1 để tăng).
     */
    changeLevel: function(delta) {
        const limitMessage = document.getElementById("minkowskiLimitMessage"); // Lấy tham chiếu đến thông báo
        const maxLevel = 5; // Giới hạn level thực tế bạn muốn cho Minkowski

        let newLevel = this.level + delta;

        if (newLevel >= maxLevel) {
            this.level = maxLevel; // Giữ ở mức tối đa
            if (limitMessage) {
                limitMessage.classList.remove('hidden'); // Hiển thị thông báo
            }
            console.warn(`[minkowskiIsland] Đã đạt giới hạn level: ${maxLevel}`);
        } else {
            this.level = Math.max(0, newLevel); // Đảm bảo level không âm
            if (limitMessage) {
                limitMessage.classList.add('hidden'); // Ẩn thông báo
            }
        }

        const increaseButton = document.getElementById("increaseLevelMinkowski");
        const decreaseButton = document.getElementById("decreaseLevelMinkowski");
        const levelDisplay = document.getElementById("levelDisplayMinkowski");

        // Vô hiệu hóa nút tăng nếu đã đạt maxLevel
        if (increaseButton) {
            increaseButton.disabled = (this.level >= maxLevel);
        }

        // Vô hiệu hóa nút giảm nếu level là 0
        if (decreaseButton) {
            decreaseButton.disabled = (this.level === 0);
        }

        if (levelDisplay) {
            levelDisplay.innerText = this.level;
        }
        console.log(`[minkowskiIsland] Thay đổi level thành: ${this.level}`);
        this.draw();
    }
};