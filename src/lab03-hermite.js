function drawHermite() {
  const canvas = document.getElementById("canvas-lab03");
  const ctx = canvas.getContext("2d");

  // Lấy các ô input
  const inputs = document.querySelectorAll("input");
  inputs.forEach((input) => input.addEventListener("input", drawHermite));

  // Lấy giá trị từ input
  let x0 = parseFloat(document.getElementById("x0").value);
  let y0 = parseFloat(document.getElementById("y0").value);
  let x1 = parseFloat(document.getElementById("x1").value);
  let y1 = parseFloat(document.getElementById("y1").value);
  let tx0 = parseFloat(document.getElementById("tx0").value);
  let ty0 = parseFloat(document.getElementById("ty0").value);
  let tx1 = parseFloat(document.getElementById("tx1").value);
  let ty1 = parseFloat(document.getElementById("ty1").value);

  // Xóa canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Vẽ điểm điều khiển
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.arc(x0, y0, 5, 0, Math.PI * 2);
  ctx.arc(x1, y1, 5, 0, Math.PI * 2);
  ctx.fill();

  // Vẽ vector tiếp tuyến
  ctx.strokeStyle = "green";
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x0 + tx0, y0 + ty0);
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 + tx1, y1 + ty1);
  ctx.stroke();

  // Vẽ đường cong Hermite
  ctx.strokeStyle = "blue";
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  for (let t = 0; t <= 1; t += 0.01) {
    let h1 = 2 * t ** 3 - 3 * t ** 2 + 1;
    let h2 = -2 * t ** 3 + 3 * t ** 2;
    let h3 = t ** 3 - 2 * t ** 2 + t;
    let h4 = t ** 3 - t ** 2;

    let x = h1 * x0 + h2 * x1 + h3 * tx0 + h4 * tx1;
    let y = h1 * y0 + h2 * y1 + h3 * ty0 + h4 * ty1;

    ctx.lineTo(x, y);
  }
  ctx.stroke();
}

drawHermite();
