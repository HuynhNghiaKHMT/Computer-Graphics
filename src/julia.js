// src/julia.js
// Định nghĩa đối tượng toàn cục cho Tập hợp Julia
window.juliaSet = {
    gl: null,
    program: null,
    cRe: -0.05, cIm: 0.0, // Hằng số cho Julia Set
    stepSize: 0.05, // Biến này hiện chưa được sử dụng trong logic vẽ
    u_scaleXLoc: null, // Vị trí uniform cho scale X
    u_scaleYLoc: null, // Vị trí uniform cho scale Y

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
        console.log("[juliaSet] Bắt đầu khởi tạo.");
        this.gl = glContext;
        if (!this.gl) {
            showCustomAlert("Ngữ cảnh WebGL không hợp lệ.", "Lỗi WebGL");
            console.error("[juliaSet] Ngữ cảnh WebGL không hợp lệ.");
            return;
        }
        console.log("[juliaSet] Ngữ cảnh WebGL hợp lệ.");
        console.log("[juliaSet] gl.isContextLost():", this.gl.isContextLost());

        this.gl.clearColor(1, 1, 1, 1); // Màu nền trắng
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        console.log("[juliaSet] Đã xóa canvas.");

        // Đảm bảo viewport được thiết lập đúng kích thước canvas
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        console.log(`[juliaSet] Viewport đã đặt thành: ${this.gl.canvas.width}x${this.gl.canvas.height}`);

        this.initShaders();
        console.log("[juliaSet] Đã khởi tạo shader.");
    },

    /**
     * Khởi tạo các shader (Vertex Shader và Fragment Shader) cho WebGL.
     * Fragment Shader chứa logic tính toán tập hợp Julia.
     */
    initShaders: function() {
        const vsSource = `
            attribute vec2 coordinates;
            uniform float u_scaleX; // Uniform cho scale X
            uniform float u_scaleY; // Uniform cho scale Y

            void main() {
                // Áp dụng scaling cho cả X và Y
                gl_Position = vec4(coordinates.x * u_scaleX, coordinates.y * u_scaleY, 0.0, 1.0);
            }
        `;

        const fsSource = `
            precision highp float;
            uniform vec2 u_resolution;
            uniform vec2 u_c;

            void main() {
                // Điều chỉnh tọa độ để phù hợp với tỉ lệ khung hình (nếu cần)
                // z = (gl_FragCoord.xy / u_resolution - 0.5) * 3.0; // Đây là cách bạn đang ánh xạ
                
                // Để đảm bảo hình vuông, chúng ta cần điều chỉnh phạm vi của z
                vec2 uv = gl_FragCoord.xy / u_resolution; // Tọa độ từ 0 đến 1
                vec2 z = (uv - 0.5) * 3.0; // Ánh xạ về khoảng [-1.5, 1.5]

                // Điều chỉnh theo tỷ lệ khung hình để giữ hình vuông
                float aspectRatio = u_resolution.x / u_resolution.y;
                if (aspectRatio > 1.0) { // Canvas rộng hơn cao
                    z.x *= aspectRatio; // Mở rộng phạm vi X để hình không bị giãn ngang
                } else { // Canvas cao hơn rộng hoặc là hình vuông
                    z.y /= aspectRatio; // Mở rộng phạm vi Y để hình không bị giãn dọc
                }

                int iter = 0;
                const int maxIter = 100;

                for (int i = 0; i < maxIter; i++) {
                    if (dot(z, z) > 4.0) break;
                    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + u_c;
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
        console.log("[juliaSet] Shader đã được sử dụng.");

        // Lấy vị trí của các uniform mới
        this.u_scaleXLoc = this.gl.getUniformLocation(this.program, "u_scaleX");
        this.u_scaleYLoc = this.gl.getUniformLocation(this.program, "u_scaleY");
    },

    /**
     * Vẽ tập hợp Julia lên canvas WebGL.
     */
    draw: function() {
        console.log("[juliaSet] Bắt đầu vẽ.");
        // Julia Set thường được vẽ bằng cách phủ một hình chữ nhật lớn lên toàn bộ canvas
        // và tính toán màu sắc cho từng pixel trong Fragment Shader.
        // Các đỉnh này tạo thành 2 tam giác tạo nên một hình vuông bao phủ toàn bộ không gian clip (-1, -1) đến (1, 1).
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

        // Tính toán và truyền các giá trị scale vào shader
        const canvasWidth = this.gl.canvas.width;
        const canvasHeight = this.gl.canvas.height;
        const aspectRatio = canvasWidth / canvasHeight;

        let scaleX = 1.0;
        let scaleY = 1.0;

        // Đối với Julia Set, chúng ta muốn hình ảnh lấp đầy toàn bộ canvas
        // nhưng vẫn giữ tỉ lệ khung hình của fractal (thường là 1:1).
        // Điều này có nghĩa là chúng ta cần điều chỉnh không gian tọa độ trong shader
        // để bù đắp cho tỉ lệ khung hình của canvas.
        // Cách tiếp cận trong Fragment Shader (như đã sửa ở trên) là tốt hơn cho Julia Set
        // vì nó tính toán trực tiếp trên tọa độ pixel.
        // Do đó, ở đây, Vertex Shader chỉ cần vẽ một hình vuông đầy đủ (-1 đến 1).
        // Các uniform u_scaleX và u_scaleY từ Vertex Shader không cần thiết cho Julia Set
        // nếu logic điều chỉnh tỉ lệ được thực hiện hoàn toàn trong Fragment Shader.
        // Tuy nhiên, để nhất quán với các fractal khác, tôi vẫn sẽ truyền chúng,
        // nhưng giá trị sẽ là 1.0 để không làm thay đổi hình vuông đầu vào.
        // Việc điều chỉnh tỉ lệ thực tế sẽ nằm trong Fragment Shader của Julia Set.

        if (this.u_scaleXLoc && this.u_scaleYLoc) {
            this.gl.uniform1f(this.u_scaleXLoc, scaleX); // Giữ nguyên 1.0
            this.gl.uniform1f(this.u_scaleYLoc, scaleY); // Giữ nguyên 1.0
        }

        // Truyền độ phân giải canvas vào Fragment Shader
        const resolution = this.gl.getUniformLocation(this.program, "u_resolution");
        this.gl.uniform2f(resolution, canvasWidth, canvasHeight); // Sử dụng canvasWidth, canvasHeight thay vì this.gl.canvas.width/height trực tiếp

        // Truyền hằng số c vào Fragment Shader
        const cLocation = this.gl.getUniformLocation(this.program, "u_c");
        this.gl.uniform2f(cLocation, this.cRe, this.cIm);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, vertices.length / 2);
        const error = this.gl.getError();
        if (error !== this.gl.NO_ERROR) {
            console.error("[juliaSet] Lỗi WebGL sau khi drawArrays:", error);
            showCustomAlert(`Lỗi WebGL trong quá trình vẽ: ${error}`, "Lỗi WebGL");
        }
        console.log("[juliaSet] Đã hoàn tất vẽ.");
    },

    /**
     * Cập nhật hằng số phức c (cRe, cIm) cho tập hợp Julia và vẽ lại.
     * @param {number} real - Phần thực của hằng số c.
     * @param {number} imag - Phần ảo của hằng số c.
     */
    updateC: function(real, imag) {
        this.cRe = real;
        this.cIm = imag;
        console.log(`[juliaSet] Cập nhật hằng số c: (${this.cRe}, ${this.cIm})`);
        this.draw();
    },

    /**
     * Thay đổi giá trị stepSize (hiện tại không được sử dụng trực tiếp trong logic vẽ Julia Set,
     * nhưng có thể được dùng cho các tính toán khác nếu bạn mở rộng).
     * @param {number} newSize - Giá trị stepSize mới.
     */
    changeStepSize: function(newSize) {
        this.stepSize = newSize;
        console.log("[juliaSet] Step Size updated to:", this.stepSize);
        // Nếu stepSize ảnh hưởng đến cách vẽ, bạn sẽ gọi this.draw() ở đây.
        // Hiện tại, nó không ảnh hưởng đến màu sắc hoặc hình dạng Julia Set
        // trừ khi bạn thay đổi logic trong Fragment Shader để sử dụng nó.
    }
};