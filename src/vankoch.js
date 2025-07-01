// Định nghĩa đối tượng toàn cục cho Bông tuyết Koch
window.kochSnowflake = {
    gl: null,
    program: null,
    level: 0,
    vertices: [],
    u_scaleXLoc: null,
    u_scaleYLoc: null,

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
            uniform float u_scaleX;
            uniform float u_scaleY;

            void main() {
                gl_Position = vec4(coordinates.x * u_scaleX, coordinates.y * u_scaleY, 0.0, 1.0);
            }
        `;
        const fsSource = `
            precision mediump float;
            void main() {
               gl_FragColor = vec4(0.027, 0.616, 0.851, 1.0);
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

    generateKochSnowflake: function(currentLevel) {
        this.vertices = [];
        const p1 = [-0.6, -0.4];
        const p2 = [0.6, -0.4];
        const p3 = [0.0, 0.6];
        
        this.generateKochSegment(p1, p2, currentLevel);
        this.generateKochSegment(p2, p3, currentLevel);
        this.generateKochSegment(p3, p1, currentLevel);
    },

    generateKochSegment: function(p1, p2, currentLevel) {
        if (currentLevel === 0) {
            this.vertices.push(...p1, ...p2);
        } else {
            let ax = (2 * p1[0] + p2[0]) / 3;
            let ay = (2 * p1[1] + p2[1]) / 3;
            let bx = (p1[0] + 2 * p2[0]) / 3;
            let by = (p1[1] + 2 * p2[1]) / 3;
            
            let angle = -Math.PI / 3;
            let cx = (bx - ax) * Math.cos(angle) - (by - ay) * Math.sin(angle) + ax;
            let cy = (bx - ax) * Math.sin(angle) + (by - ay) * Math.cos(angle) + ay;
            
            this.generateKochSegment(p1, [ax, ay], currentLevel - 1);
            this.generateKochSegment([ax, ay], [cx, cy], currentLevel - 1);
            this.generateKochSegment([cx, cy], [bx, by], currentLevel - 1);
            this.generateKochSegment([bx, by], p2, currentLevel - 1);
        }
    },

    draw: function() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.generateKochSnowflake(this.level);
        
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
        
        this.gl.drawArrays(this.gl.LINES, 0, this.vertices.length / 2);
        const error = this.gl.getError();
        if (error !== this.gl.NO_ERROR) {
            console.error("Lỗi WebGL sau khi drawArrays:", error);
            showCustomAlert(`Lỗi WebGL trong quá trình vẽ: ${error}`, "Lỗi WebGL");
        }
    },

    changeLevel: function(delta) {
        const limitMessage = document.getElementById("kochLimitMessage");
        const maxLevel = 6; 
        
        let newLevel = this.level + delta;

        if (newLevel > maxLevel) {
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

        const increaseButton = document.getElementById("increaseLevelKoch");
        const decreaseButton = document.getElementById("decreaseLevelKoch");
        const levelDisplay = document.getElementById("levelDisplayKoch");

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