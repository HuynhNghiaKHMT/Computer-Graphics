// Lấy đối tượng Canvas và Context
var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");

// Thiết lập kích thước canvas
var width = 800;
var height = 600;
canvas.width = width;
canvas.height = height;

// Màu sắc
var bgRgba = [240, 240, 200, 255]; // Màu nền canvas
var pointRgba = [255, 0, 0, 255]; // Màu điểm
var lineRgba = [0, 0, 0, 255]; // Màu đường nối giữa các điểm

// Thiết lập màu nền cho canvas
context.fillStyle = `rgba(${bgRgba[0]}, ${bgRgba[1]}, ${bgRgba[2]}, ${bgRgba[3] / 255})`;
context.fillRect(0, 0, canvas.width, canvas.height);

// Danh sách các đường tròn đã vẽ
var circles = [];

// Hàm vẽ điểm trên canvas
function drawPixel(x, y, color) {
    context.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 255})`;
    context.fillRect(x, y, 1, 1);
}

// Thuật toán Midpoint cải tiến để vẽ đường tròn
function drawCircle(xc, yc, radius) {
    var x = 0;
    var y = radius;
    var d = 1 - radius;
    
    drawCirclePoints(xc, yc, x, y);
    
    while (x < y) {
        x++;
        if (d < 0) {
            d += 2 * x + 1;
        } else {
            y--;
            d += 2 * (x - y) + 1;
        }
        drawCirclePoints(xc, yc, x, y);
    }
}

// Hàm vẽ các điểm đối xứng
function drawCirclePoints(xc, yc, x, y) {
    drawPixel(xc + x, yc + y, pointRgba);
    drawPixel(xc - x, yc + y, pointRgba);
    drawPixel(xc + x, yc - y, pointRgba);
    drawPixel(xc - x, yc - y, pointRgba);
    drawPixel(xc + y, yc + x, pointRgba);
    drawPixel(xc - y, yc + x, pointRgba);
    drawPixel(xc + y, yc - x, pointRgba);
    drawPixel(xc - y, yc - x, pointRgba);
}

// Xử lý sự kiện chuột
canvas.addEventListener("click", function (event) {
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    var radius = 50;
    
    // Lưu đường tròn vào danh sách
    circles.push({ x, y, radius });
    
    // Vẽ lại tất cả đường tròn đã vẽ mà không xóa chúng
    context.fillStyle = `rgba(${bgRgba[0]}, ${bgRgba[1]}, ${bgRgba[2]}, ${bgRgba[3] / 255})`;
    context.fillRect(0, 0, canvas.width, canvas.height);
    circles.forEach(circle => drawCircle(circle.x, circle.y, circle.radius));
});

// Xóa canvas
function clearCanvas() {
    context.fillStyle = `rgba(${bgRgba[0]}, ${bgRgba[1]}, ${bgRgba[2]}, ${bgRgba[3] / 255})`;
    context.fillRect(0, 0, canvas.width, canvas.height);
    circles = [];
}

document.getElementById("reset").addEventListener("click", clearCanvas);
