function updateValue(spanId, value) {
    document.getElementById(spanId).innerText = value;
}

function drawGraph() {
    let canvas = document.getElementById("canvas-lab03");
    let ctx = canvas.getContext("2d");
    let width = canvas.width;
    let height = canvas.height;

    // Lấy giá trị từ slider
    let tmin_ft = parseFloat(document.getElementById("tmin").value);
    let tmax_ft = parseFloat(document.getElementById("tmax").value);
    let lamda = parseFloat(document.getElementById("tlamda").value);

    tmin_ft = tmin_ft * Math.PI
    tmax_ft =  tmax_ft * Math.PI

    // console.log("tmin_fx:", tmin_ft, "tmax_fx:", tmax_ft);

   
    // Đảm bảo xmin <= xmax
    if (tmin_ft >= tmax_ft) {
        document.getElementById("tmax").value = tmin_ft
        tmax_ft = tmin_ft
    }

    // Dịch tâm về giữa canvas
    const cx = width / 2;
    const cy = height / 2;
    const scale = 200; // Độ phóng đại

    // Hàm chuyển đổi tọa độ
    function toCanvasX(x) {
        return cx + x * scale;
    }

    function toCanvasY(y) {
        return cy - y * scale;
    }

    // Xóa canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Vẽ trục tọa độ
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;

    // Trục X
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(width, cy);
    ctx.stroke();

    // Trục Y
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, height);
    ctx.stroke();

    // Hiển thị số trên trục tọa độ
    ctx.font = "14px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";

    // Trục X
    for (let x = -2; x <= 2; x++) {
        let canvasX = cx + x * scale;
        ctx.fillText(x, canvasX, cy + 15);
    }

    // Trục Y
    ctx.textAlign = "right";
    for (let y = -2; y <= 2; y++) {
        let canvasY = cy - y * scale;
        if (y !== 0) {
            ctx.fillText(y, cx - 5, canvasY + 5);
        }
    }

    // Vẽ đồ thị
    ctx.strokeStyle = "red";
    ctx.lineWidth = 1;
    ctx.beginPath();

    let first = true;
    for (let t = tmin_ft; t <= tmax_ft; t += lamda) {
        let x = Math.cos(5 * t) * Math.cos(t);
        let y = Math.cos(5 * t) * Math.sin(t);

        let canvasX = toCanvasX(x);
        let canvasY = toCanvasY(y);

        if (first) {
            ctx.moveTo(canvasX, canvasY);
            first = false
        } else {
            ctx.lineTo(canvasX, canvasY);
        }
    }

    ctx.stroke();
}

drawGraph();

// Cập nhật khi thay đổi giá trị slider
document.getElementById("tmin").addEventListener("input", drawGraph);
document.getElementById("tmax").addEventListener("input", drawGraph);
document.getElementById("tlamda").addEventListener("input", drawGraph);