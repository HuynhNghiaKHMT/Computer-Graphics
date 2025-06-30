function drawBezier() {
    const canvas = document.getElementById("canvas-lab03");
    if (!canvas) {
        console.error("Canvas element 'canvas-lab03' not found in drawBezier!");
        return;
    }
    const ctx = canvas.getContext("2d");

    // Xóa canvas trước khi vẽ
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Lấy tọa độ từ input
    let points = [];
    for (let i = 0; i < 6; i++) {
        const px = document.getElementById(`p${i}x`);
        const py = document.getElementById(`p${i}y`);

        if (!px || !py) {
            console.warn(`Input element p${i}x or p${i}y not found for Bezier. Skipping point.`);
            // Bạn có thể return hoặc bỏ qua điểm này tùy vào logic mong muốn
            return; 
        }

        let x = Number(px.value);
        let y = Number(py.value);
        points.push({ x, y });
    }

    // Vẽ đường nối các điểm điều khiển (đường nét đứt)
    ctx.strokeStyle = "black";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]); // Reset về nét liền

    // Vẽ các điểm điều khiển
    ctx.fillStyle = "red";
    for (let p of points) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Vẽ đường Bezier
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    let t, x, y;
    for (t = 0; t <= 1; t += 0.001) { // Bước nhảy nhỏ hơn cho đường cong mượt mà hơn
        // Công thức Bezier bậc 5
        x = (1 - t) ** 5 * points[0].x +
            5 * (1 - t) ** 4 * t * points[1].x +
            10 * (1 - t) ** 3 * t ** 2 * points[2].x +
            10 * (1 - t) ** 2 * t ** 3 * points[3].x +
            5 * (1 - t) * t ** 4 * points[4].x +
            t ** 5 * points[5].x;

        y = (1 - t) ** 5 * points[0].y +
            5 * (1 - t) ** 4 * t * points[1].y +
            10 * (1 - t) ** 3 * t ** 2 * points[2].y +
            10 * (1 - t) ** 2 * t ** 3 * points[3].y +
            5 * (1 - t) * t ** 4 * points[4].y +
            t ** 5 * points[5].y;

        ctx.lineTo(x, y);
    }

    ctx.stroke();
}

// Hàm khởi tạo
window.initBezier = function() {
    console.log("initBezier called. Setting up event listeners for Bezier points.");
    
    // Thêm các event listener cho tất cả các input tọa độ điểm điều khiển
    for (let i = 0; i < 6; i++) {
        const px = document.getElementById(`p${i}x`);
        const py = document.getElementById(`p${i}y`);

        // Xóa các event listener cũ để tránh trùng lặp
        if (px) px.removeEventListener("input", drawBezier);
        if (py) py.removeEventListener("input", drawBezier);

        // Thêm các event listener mới
        if (px) px.addEventListener("input", drawBezier);
        if (py) py.addEventListener("input", drawBezier);
    }
    
    drawBezier(); // Vẽ đường cong ban đầu khi lab này được kích hoạt
};

// Hàm dọn dẹp
window.cleanupBezier = function() {
    console.log("cleanupBezier called. Removing event listeners for Bezier points.");
    for (let i = 0; i < 6; i++) {
        const px = document.getElementById(`p${i}x`);
        const py = document.getElementById(`p${i}y`);
        if (px) px.removeEventListener("input", drawBezier);
        if (py) py.removeEventListener("input", drawBezier);
    }
};