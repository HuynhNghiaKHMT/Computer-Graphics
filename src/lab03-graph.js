function updateValue(spanId, value) {
    document.getElementById(spanId).innerText = value;
}

function drawGraph() {
    let canvas = document.getElementById("canvas-lab03");
    let ctx = canvas.getContext("2d");
    let width = canvas.width;
    let height = canvas.height;
    

    // Lấy giá trị từ slider
    let xmin_fx = parseInt(document.getElementById("xmin").value);
    let xmax_fx = parseInt(document.getElementById("xmax").value);
    let lamda = parseFloat(document.getElementById("lamda").value);

    // Đảm bảo xmin <= xmax
    if (xmin_fx >= xmax_fx) {
        document.getElementById("xmax").value = xmin_fx;
        xmax_fx = xmin_fx;
    }

    let ymin = -5, ymax = 5;
    let xmin = -7, xmax = 7;

    let xStep = 1; // Bước nhảy trục X
    let yStep = 1; // Bước nhảy trục Y

    // Hàm chuyển đổi tọa độ
    function toCanvasX(x) {
        return ((x - xmin) / (xmax - xmin)) * width;
    }

    function toCanvasY(y) {
        return height - ((y - ymin) / (ymax - ymin)) * height;
    }

    // Xóa canvas
    ctx.clearRect(0, 0, width, height);

    // Vẽ trục tọa độ
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;

    // Trục X
    ctx.beginPath();
    ctx.moveTo(toCanvasX(xmin), toCanvasY(0));
    ctx.lineTo(toCanvasX(xmax), toCanvasY(0));
    ctx.stroke();

    // Trục Y
    ctx.beginPath();
    ctx.moveTo(toCanvasX(0), toCanvasY(ymin));
    ctx.lineTo(toCanvasX(0), toCanvasY(ymax));
    ctx.stroke();

    // Hiển thị số trên trục tọa độ
    ctx.font = "14px Arial";
    ctx.fillStyle = "black";

    // Số trên trục X
    ctx.textAlign = "center";
    for (let x = xmin; x <= xmax; x += xStep) {
        let canvasX = toCanvasX(x);
        ctx.fillText(x, canvasX, toCanvasY(0) + 15);
    }

    // Số trên trục Y
    ctx.textAlign = "right";
    for (let y = ymin; y <= ymax; y += yStep) {
        let canvasY = toCanvasY(y);
        ctx.fillText(y, toCanvasX(0) - 5, canvasY + 5);
    }

    // Vẽ đồ thị hàm số y = (0.1x³ - 0.2x² - 0.2x + 3)
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.beginPath();

    let first = true;
    for (let x = xmin_fx; x <= xmax_fx; x += lamda) {
        let y = (0.1 * x ** 3 - 0.2 * x ** 2 - 0.2 * x + 3);
        let canvasX = toCanvasX(x);
        let canvasY = toCanvasY(y);

        if (first) {
            ctx.moveTo(canvasX, canvasY);
            first = false;
        } else {
            ctx.lineTo(canvasX, canvasY);
        }
    }
    ctx.stroke();
}

// Vẽ đồ thị ban đầu
drawGraph();

// Cập nhật khi thay đổi giá trị slider
document.getElementById("xmin").addEventListener("input", drawGraph);
document.getElementById("xmax").addEventListener("input", drawGraph);
document.getElementById("lamda").addEventListener("input", drawGraph);