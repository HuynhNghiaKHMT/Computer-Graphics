// Khởi tạo và Thiết lập Canvas
var canvas = document.getElementById("canvas-lab01");
var context = canvas.getContext("2d");

var width = 850;
var height = 550;


// Khai báo các Màu Sắc (RGBA)
var bgRgba = [255, 255, 255, 255]; // Màu nền
var pointRgba = [255, 0, 0, 255]; // Màu tọa độ tâm
var lineRgba = [0, 0, 0, 255]; // Màu đường tròn thực sự
var vlineRgba = [0, 255, 0, 255]; // Màu đường tròn tạm thời

// Thiết lập Kích thước Canvas
canvas.setAttribute("width", width);
canvas.setAttribute("height", height);

// Hàm Vẽ
function Painter_MidPoint(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.points = [];
    this.lines = [];

    this.setPixel = function (x, y, rgba) {
        this.ctx.fillStyle = `rgba(${rgba.join(',')})`;
        this.ctx.fillRect(x, y, 1, 1);
    };

    this.drawBkg = function (ctx, width, height, rgba) {
        this.ctx.fillStyle = `rgba(${rgba.join(',')})`;
        this.ctx.fillRect(0, 0, width, height);
    };

    this.drawCircle = function (cx, cy, r, rgba) {
        let x = 0, y = r;
        let d = 1 - r;

        const plotCirclePoints = (px, py) => {
            this.setPixel(cx + px, cy + py, rgba);
            this.setPixel(cx - px, cy + py, rgba);
            this.setPixel(cx + px, cy - py, rgba);
            this.setPixel(cx - px, cy - py, rgba);
            this.setPixel(cx + py, cy + px, rgba);
            this.setPixel(cx - py, cy + px, rgba);
            this.setPixel(cx + py, cy - px, rgba);
            this.setPixel(cx - py, cy - px, rgba);
        };

        while (x <= y) {
            plotCirclePoints(x, y);
            if (d < 0) {
                d += 2 * x + 3;
            } else {
                d += 2 * (x - y) + 5;
                y--;
            }
            x++;
        }
    };

    this.draw = function () {
        this.drawBkg(this.ctx, this.canvas.width, this.canvas.height, bgRgba); // Vẽ màu nền
        for (let i = 0; i < this.lines.length; i++) {
            let line = this.lines[i];
            this.drawCircle(line.center[0], line.center[1], line.radius, lineRgba);
        }
    };

    this.clear = function () {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.points = [];
        this.lines = [];
        this.drawBkg(this.ctx, this.canvas.width, this.canvas.height, bgRgba); // Vẽ màu nền
    };
}

// Khởi tạo Painter
var painter = new Painter_MidPoint(canvas);
painter.drawBkg(painter.ctx, canvas.width, canvas.height, bgRgba);

// Chuyển đổi tọa độ chuột sang tọa độ canvas
midpoint_getPosOnCanvas = function (x, y) {
    var bbox = canvas.getBoundingClientRect();
    return [
        Math.floor(x - bbox.left * (canvas.width / bbox.width) + 0.5),
        Math.floor(y - bbox.top * (canvas.height / bbox.height) + 0.5),
    ];
};

// Hàm tính toán tâm và bán kính đường tròn
function calculateCircleParams(x1, y1, x2, y2) {
    let centerX = Math.round((x1 + x2) / 2);
    let centerY = Math.round((y1 + y2) / 2);
    let radius = Math.round(Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) / 2);
    return { centerX, centerY, radius };
}

// Khởi tạo Trạng Thái
state = 0; // 0: waiting 1: drawing 2: finished
clickPos = [-1, -1];

// Xử lý Sự Kiện
// Nhấp chuột (mousedown)
midpoint_doMouseDown = function (e) {
    if (state !== 0) return;
    state = 1;
    var pos = midpoint_getPosOnCanvas(e.clientX, e.clientY);
    clickPos = pos;// Điểm A (x1, y1)
};

// Di chuyển chuột (mousemove)
midpoint_doMouseMove = function (e) {
    if (state !== 1) return;
    var pos = midpoint_getPosOnCanvas(e.clientX, e.clientY);
    var { centerX, centerY, radius } = calculateCircleParams(clickPos[0], clickPos[1], pos[0], pos[1]);

    // Vẽ lại canvas với đường tròn tạm thời
    painter.draw();
    painter.drawCircle(centerX, centerY, radius, vlineRgba);
};

// Thả chuột (mousedown)
midpoint_doMouseUp = function (e) {
    if (state !== 1) return;
    state = 2;
    var pos = midpoint_getPosOnCanvas(e.clientX, e.clientY);
    var { centerX, centerY, radius } = calculateCircleParams(clickPos[0], clickPos[1], pos[0], pos[1]);

    // Lưu lại tâm và bán kính đường tròn
    painter.points.push([centerX, centerY]); 
    painter.lines.push({ center: [centerX, centerY], radius: radius });

    // Vẽ lại tất cả
    painter.draw();
    painter.drawCircle(centerX, centerY, radius, lineRgba);

    state = 0; // Quay lại trạng thái chờ
};

// Nhấn phím (keydown)
midpoint_doKeyDown = function (e) {
    var keyId = e.keyCode ? e.keyCode : e.which;
    if (keyId == 27 && (state == 1 || state == 0)) { // esc
      state = 2; 
    }
    if (e.ctrlKey && state == 2) { // Ctrl
      state = 0; 
    }
};

// Nút Reset
midpoint_doReset = function () {
    state = 0;
    painter.clear(); // Xóa toàn bộ canvas
};

canvas.addEventListener("mousedown", midpoint_doMouseDown, false);
canvas.addEventListener("mousemove", midpoint_doMouseMove, false);
canvas.addEventListener("mouseup", midpoint_doMouseUp, false);
window.addEventListener("keydown", midpoint_doKeyDown, false);

var resetButton = document.getElementById("reset");
resetButton.addEventListener("click", midpoint_doReset, false);
