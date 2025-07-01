// src/sierpinskiT.js
// Định nghĩa đối tượng toàn cục cho Tam giác Sierpinski
window.sierpinskiTriangles = {
    gl: null,
    program: null,
    level: 0,
    vertices: [],
    u_scaleXLoc: null, // Vị trí uniform cho scale X
    u_scaleYLoc: null, // Vị trí uniform cho scale Y

    checkShaderCompile: function(shader) {
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const error = this.gl.getShaderInfoLog(shader);
            console.error("Lỗi biên dịch Shader:", error);
            showCustomAlert(`Lỗi biên dịch Shader: ${error}`, "Lỗi Shader");
        }
    },

    checkProgramLink: function(program) {
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            const error = this.gl.getProgramInfoLog(program);
            console.error("Lỗi liên kết chương trình:", error);
            showCustomAlert(`Lỗi liên kết chương trình: ${error}`, "Lỗi Shader");
        }
    },

    init: function(glContext) {
        this.gl = glContext;
        if (!this.gl) {
            showCustomAlert("Ngữ cảnh WebGL không hợp lệ.", "Lỗi WebGL");
            return;
        }

        this.gl.clearColor(1, 1, 1, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        
        this.initShaders();
    },

    initShaders: function() {
        const vsSource = `
            attribute vec2 coordinates;
            uniform float u_scaleX; // Uniform cho scale X
            uniform float u_scaleY; // Uniform cho scale Y

            void main() {
                gl_Position = vec4(coordinates.x * u_scaleX, coordinates.y * u_scaleY, 0.0, 1.0);
            }
        `;
        const fsSource = `
            precision mediump float;
            void main() {
                gl_FragColor = vec4(0.635, 0.863, 0.933, 1.0); // Màu xanh nhạt
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

        this.u_scaleXLoc = this.gl.getUniformLocation(this.program, "u_scaleX");
        this.u_scaleYLoc = this.gl.getUniformLocation(this.program, "u_scaleY");
    },

    generateSierpinski: function(currentLevel, p1, p2, p3) {
        if (currentLevel === 0) {
            this.vertices.push(...p1, ...p2, ...p3);
        } else {
            let mid1 = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
            let mid2 = [(p2[0] + p3[0]) / 2, (p2[1] + p3[1]) / 2];
            let mid3 = [(p1[0] + p3[0]) / 2, (p1[1] + p3[1]) / 2];
            
            this.generateSierpinski(currentLevel - 1, p1, mid1, mid3);
            this.generateSierpinski(currentLevel - 1, mid1, p2, mid2);
            this.generateSierpinski(currentLevel - 1, mid3, mid2, p3);
        }
    },

    draw: function() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.vertices = [];
        
        const p1 = [-0.6, -0.5];
        const p2 = [0.6, -0.5];
        const p3 = [0.0, 0.6];
        this.generateSierpinski(this.level, p1, p2, p3);
        
        const canvasWidth = this.gl.canvas.width;
        const canvasHeight = this.gl.canvas.height;
        const aspectRatio = canvasWidth / canvasHeight;

        let scaleX = 1.0;
        let scaleY = 1.0;

        if (aspectRatio > 1) { 
            scaleX = canvasHeight / canvasWidth; 
            scaleY = 1.0; 
        } else if (aspectRatio < 1) { 
            scaleX = 1.0; 
            scaleY = canvasWidth / canvasHeight; 
        }

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
        
        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertices.length / 2);
        const error = this.gl.getError();
        if (error !== this.gl.NO_ERROR) {
            console.error("Lỗi WebGL sau khi drawArrays:", error);
            showCustomAlert(`Lỗi WebGL trong quá trình vẽ: ${error}`, "Lỗi WebGL");
        }
    },

    changeLevel: function(delta) {
        const limitMessage = document.getElementById("sierpinskiTLimitMessage"); // Lấy tham chiếu đến thông báo
        const maxLevel = 6; // Giới hạn level cho Tam giác Sierpinski

        let newLevel = this.level + delta;

        if (newLevel >= maxLevel) {
            this.level = maxLevel;
            if (limitMessage) {
                limitMessage.classList.remove('hidden');
            }
        } else {
            this.level = Math.max(0, newLevel);
            if (limitMessage) {
                limitMessage.classList.add('hidden');
            }
        }

        const increaseButton = document.getElementById("increaseLevelSierpinskiT");
        const decreaseButton = document.getElementById("decreaseLevelSierpinskiT");
        const levelDisplay = document.getElementById("levelDisplaySierpinskiT");

        if (increaseButton) {
            increaseButton.disabled = (this.level >= maxLevel);
        }

        if (decreaseButton) {
            decreaseButton.disabled = (this.level === 0);
        }

        if (levelDisplay) {
            levelDisplay.innerText = this.level;
        }
        this.draw();
    }
};