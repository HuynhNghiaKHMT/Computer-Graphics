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
function Painter_ellipse(canvas) {
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

    this.drawEllipse = function (cx, cy, rx, ry, rgba) {
        let x = 0, y = ry;
        let rxSq = rx * rx, rySq = ry * ry;
        let d1 = rySq - rxSq * ry + 0.25 * rxSq;
        let dx = 2 * rySq * x;
        let dy = 2 * rxSq * y;
    
        const plotEllipsePoints = (px, py) => {
            this.setPixel(cx + px, cy + py, rgba);
            this.setPixel(cx - px, cy + py, rgba);
            this.setPixel(cx + px, cy - py, rgba);
            this.setPixel(cx - px, cy - py, rgba);
        };
    
        // Vẽ vùng 1
        while (dx < dy) {
            plotEllipsePoints(x, y);
            if (d1 < 0) {
                x++;
                dx += 2 * rySq;
                d1 += dx + rySq;
            } else {
                x++;
                y--;
                dx += 2 * rySq;
                dy -= 2 * rxSq;
                d1 += dx - dy + rySq;
            }
        }
    
        // Vẽ vùng 2
        let d2 = rySq * (x + 0.5) * (x + 0.5) + rxSq * (y - 1) * (y - 1) - rxSq * rySq;
        while (y >= 0) {
            plotEllipsePoints(x, y);
            if (d2 > 0) {
                y--;
                dy -= 2 * rxSq;
                d2 += rxSq - dy;
            } else {
                y--;
                x++;
                dx += 2 * rySq;
                dy -= 2 * rxSq;
                d2 += dx - dy + rxSq;
            }
        }
    };    

    this.draw = function () {
        this.drawBkg(this.ctx, this.canvas.width, this.canvas.height, bgRgba); // Vẽ màu nền
        for (let i = 0; i < this.lines.length; i++) {
            let line = this.lines[i];
            this.drawEllipse(line.center[0], line.center[1], line.rx, line.ry, lineRgba);
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
var painter = new Painter_ellipse(canvas);
painter.drawBkg(painter.ctx, canvas.width, canvas.height, bgRgba);

// Chuyển đổi tọa độ chuột sang tọa độ canvas
ellipse_getPosOnCanvas = function (x, y) {
    var bbox = canvas.getBoundingClientRect();
    return [
        Math.floor(x - bbox.left * (canvas.width / bbox.width) + 0.5),
        Math.floor(y - bbox.top * (canvas.height / bbox.height) + 0.5),
    ];
};

// Hàm tính toán tâm và trục lớn, trục nhỏ
function calculateEllipseParams(x1, y1, x2, y2) {
    let centerX = Math.round((x1 + x2) / 2);
    let centerY = Math.round((y1 + y2) / 2);
    let rx = Math.abs(x2 - x1) / 2;
    let ry = Math.abs(y2 - y1) / 2;
    return { centerX, centerY, rx, ry };
}

// Khởi tạo Trạng Thái
state = 0; // 0: waiting 1: drawing 2: finished
clickPos = [-1, -1];

// Xử lý Sự Kiện
// Nhấp chuột (mousedown)
ellipse_doMouseDown = function (e) {
    if (state !== 0) return;
    state = 1;
    var pos = ellipse_getPosOnCanvas(e.clientX, e.clientY);
    clickPos = pos;// Điểm A (x1, y1)
};

// Di chuyển chuột (mousemove)
ellipse_doMouseMove = function (e) {
    if (state !== 1) return;
    var pos = ellipse_getPosOnCanvas(e.clientX, e.clientY);
    var { centerX, centerY, rx, ry } = calculateEllipseParams(clickPos[0], clickPos[1], pos[0], pos[1]);

    // Vẽ lại canvas với đường ellipse tạm thời
    painter.draw();
    painter.drawEllipse(centerX, centerY, rx, ry, vlineRgba);
};

// Thả chuột (mousedown)
ellipse_doMouseUp = function (e) {
    if (state !== 1) return;
    state = 2;
    var pos = ellipse_getPosOnCanvas(e.clientX, e.clientY);
    var { centerX, centerY, rx, ry } = calculateEllipseParams(clickPos[0], clickPos[1], pos[0], pos[1]);

    // Lưu lại tâm và bán kính đường ellipse thục sụ
    painter.points.push([centerX, centerY]); 
    painter.lines.push({ center: [centerX, centerY], rx: rx, ry: ry });

    // Vẽ lại tất cả
    painter.draw();
    painter.drawEllipse(centerX, centerY, rx, ry, lineRgba);

    state = 0; // Quay lại trạng thái chờ
};

// Nhấn phím (keydown)
ellipse_doKeyDown = function (e) {
    var keyId = e.keyCode ? e.keyCode : e.which;
    if (keyId == 27 && (state == 1 || state == 0)) { // esc
      state = 2; 
    }
    if (e.ctrlKey && state == 2) { // Ctrl
      state = 0; 
    }
};

// Nút Reset
ellipse_doReset = function () {
    state = 0;
    painter.clear(); // Xóa toàn bộ canvas
};

canvas.addEventListener("mousedown", ellipse_doMouseDown, false);
canvas.addEventListener("mousemove", ellipse_doMouseMove, false);
canvas.addEventListener("mouseup", ellipse_doMouseUp, false);
window.addEventListener("keydown", ellipse_doKeyDown, false);

var resetButton = document.getElementById("reset");
resetButton.addEventListener("click", ellipse_doReset, false);
