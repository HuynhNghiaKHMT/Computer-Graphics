// src/mandelbrot.js
// Định nghĩa đối tượng toàn cục cho Tập hợp Mandelbrot
window.mandelbrotSet = {
    gl: null,
    program: null,
    zoom: 1.0,
    offsetX: -0.5,
    offsetY: 0.0,
    u_resolutionLoc: null,
    u_zoomLoc: null,
    u_offsetLoc: null,

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
     * @param {WebGLRenderingContext} glContext - Ngữ cảnh WebGL được truyền từ lab04.js hoặc tự khởi tạo.
     */
    init: function(glContext) {
        console.log("[mandelbrotSet] Bắt đầu khởi tạo.");
        this.gl = glContext;
        if (!this.gl) {
            showCustomAlert("Ngữ cảnh WebGL không hợp lệ.", "Lỗi WebGL");
            console.error("[mandelbrotSet] Ngữ cảnh WebGL không hợp lệ.");
            return;
        }
        console.log("[mandelbrotSet] Ngữ cảnh WebGL hợp lệ.");
        console.log("[mandelbrotSet] gl.isContextLost():", this.gl.isContextLost());

        this.gl.clearColor(1, 1, 1, 1); // Màu nền trắng
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        console.log("[mandelbrotSet] Đã xóa canvas.");

        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        console.log(`[mandelbrotSet] Viewport đã đặt thành: ${this.gl.canvas.width}x${this.gl.canvas.height}`);
        
        this.initShaders();
        console.log("[mandelbrotSet] Đã khởi tạo shader.");
    },

    /**
     * Khởi tạo các shader (Vertex Shader và Fragment Shader) cho WebGL.
     * Fragment Shader chứa logic tính toán tập hợp Mandelbrot.
     */
    initShaders: function() {
        const vsSource = `
            attribute vec2 coordinates;
            void main() {
                gl_Position = vec4(coordinates, 0.0, 1.0);
            }
        `;

        const fsSource = `
            precision highp float;
            uniform vec2 u_resolution;
            uniform float u_zoom;
            uniform vec2 u_offset;

            void main() {
                // Ánh xạ tọa độ pixel về không gian fractal, điều chỉnh theo zoom và offset
                // Đồng thời điều chỉnh theo tỉ lệ khung hình của canvas
                vec2 uv = gl_FragCoord.xy / u_resolution; // Tọa độ từ 0 đến 1
                vec2 c = (uv - 0.5) * (3.0 / u_zoom); // Ánh xạ về khoảng [-1.5, 1.5] / zoom

                // Điều chỉnh theo tỷ lệ khung hình để giữ hình vuông fractal
                float aspectRatio = u_resolution.x / u_resolution.y;
                if (aspectRatio > 1.0) { // Canvas rộng hơn cao
                    c.x *= aspectRatio; // Mở rộng phạm vi X để hình không bị giãn ngang
                } else { // Canvas cao hơn rộng hoặc là hình vuông
                    c.y /= aspectRatio; // Mở rộng phạm vi Y để hình không bị giãn dọc
                }

                c += u_offset; // Áp dụng offset

                vec2 z = c;
                int iter = 0; 
                const int maxIter = 100; // Số lần lặp tối đa

                for (int i = 0; i < maxIter; i++) {
                    if (dot(z, z) > 4.0) break;
                    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
                    iter++; 
                }

                float color = float(iter) / float(maxIter);
                gl_FragColor = vec4(0.5 + 0.5 * cos(3.0 + color * 10.0), 
                                     0.5 + 0.5 * cos(2.0 + color * 10.0), 
                                     0.5 + 0.5 * cos(1.0 + color * 10.0), 1.0);
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
        console.log("[mandelbrotSet] Shader đã được sử dụng.");

        // Lấy vị trí của các uniform
        this.u_resolutionLoc = this.gl.getUniformLocation(this.program, "u_resolution");
        this.u_zoomLoc = this.gl.getUniformLocation(this.program, "u_zoom");
        this.u_offsetLoc = this.gl.getUniformLocation(this.program, "u_offset");
    },

    /**
     * Vẽ tập hợp Mandelbrot lên canvas WebGL.
     */
    draw: function() {
        console.log("[mandelbrotSet] Bắt đầu vẽ.");
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // Các đỉnh tạo thành 2 tam giác tạo nên một hình vuông bao phủ toàn bộ không gian clip (-1, -1) đến (1, 1).
        const vertices = new Float32Array([
            -1, -1, // bottom-left
             1, -1, // bottom-right
            -1,  1, // top-left

            -1,  1, // top-left
             1, -1, // bottom-right
             1,  1  // top-right
        ]);

        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

        const coord = this.gl.getAttribLocation(this.program, "coordinates");
        this.gl.vertexAttribPointer(coord, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(coord);

        // Truyền các uniform vào Fragment Shader
        this.gl.uniform2f(this.u_resolutionLoc, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.uniform1f(this.u_zoomLoc, this.zoom);
        this.gl.uniform2f(this.u_offsetLoc, this.offsetX, this.offsetY);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, vertices.length / 2);
        const error = this.gl.getError();
        if (error !== this.gl.NO_ERROR) {
            console.error("[mandelbrotSet] Lỗi WebGL sau khi drawArrays:", error);
            showCustomAlert(`Lỗi WebGL trong quá trình vẽ: ${error}`, "Lỗi WebGL");
        }
        console.log("[mandelbrotSet] Đã hoàn tất vẽ.");
    },

    /**
     * Cập nhật các thông số zoom và offset cho Tập hợp Mandelbrot và vẽ lại.
     * @param {number} newZoom - Giá trị zoom mới.
     * @param {number} newOffsetX - Offset X mới.
     * @param {number} newOffsetY - Offset Y mới.
     */
    updateView: function(newZoom, newOffsetX, newOffsetY) {
        this.zoom = newZoom;
        this.offsetX = newOffsetX;
        this.offsetY = newOffsetY;
        console.log(`[mandelbrotSet] Cập nhật view: Zoom=${this.zoom}, Offset=(${this.offsetX}, ${this.offsetY})`);
        this.draw();
    },

    /**
     * Đặt lại zoom và offset về giá trị mặc định.
     */
    resetView: function() {
        this.zoom = 1.0;
        this.offsetX = -0.5;
        this.offsetY = 0.0;
        console.log("[mandelbrotSet] Đặt lại view.");
        this.draw();
    }
};

// Đảm bảo rằng hàm init của Mandelbrot Set được gọi khi canvas được khởi tạo trong lab04.js
// Giả định lab04.js sẽ truyền ngữ cảnh gl và gọi window.mandelbrotSet.init(gl);
// Hàm onload cũ đã được loại bỏ để tích hợp vào cấu trúc quản lý fractal chung.

// Thêm lắng nghe sự kiện bàn phím nếu bạn muốn giữ lại chức năng điều khiển bằng phím
// Điều này nên được quản lý ở cấp cao hơn, ví dụ trong lab04.js
// hoặc bạn có thể thêm nó trực tiếp vào đây nếu Mandelbrot là fractal duy nhất sử dụng phím.
// Nếu giữ ở đây:
document.addEventListener("keydown", (event) => {
    const m = window.mandelbrotSet;
    if (event.key === "ArrowUp") m.offsetY += 0.1 / m.zoom;
    if (event.key === "ArrowDown") m.offsetY -= 0.1 / m.zoom;
    if (event.key === "ArrowLeft") m.offsetX -= 0.1 / m.zoom;
    if (event.key === "ArrowRight") m.offsetX += 0.1 / m.zoom;
    if (event.key === "+") m.zoom *= 1.2;
    if (event.key === "-") m.zoom /= 1.2;
    m.draw();
});