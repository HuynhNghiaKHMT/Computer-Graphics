// Khởi tạo và Thiết lập Canvas
var canvas = document.getElementById("canvas-lab01");
var context = canvas.getContext("2d");

var width = 850;
var height = 550;

/*
 canvas để vẽ có kích thước là width x height pixel 
 Mỗi pixel có 4 giá trị màu (RGBA: Red, Green, Blue, Alpha).
 Mảng dữ liệu ảnh có độ dài width * height * 4
*/

// Khai báo các Màu Sắc (RGBA)
var bgRgba = [255, 255, 255, 255]; // Màu nền
var pointRgba = [0, 0, 255, 255]; // Màu điểm
var lineRgba = [0, 0, 0, 255]; // Màu đường nối giữa các điểm
var vlineRgba = [0, 255, 0, 255]; // Màu đường tạm thời khi vẽ

// Thiết lập Kích thước Canvas
canvas.setAttribute("width", width);
canvas.setAttribute("height", height);

// Hàm Vẽ
function Painter_DDA(context, width, height) {
  // Khởi tạo các thuộc tính
  this.context = context;
  this.imageData = context.createImageData(width, height); // lưu dữ liệu hình ảnh của canvas.
  this.points = []; // Danh sách điểm của đường đang vẽ
  this.lines = [];  // Danh sách các đường đã vẽ trước đó
  //this.allPoints = []; // Lưu trữ tất cả các điểm control đã vẽ
  //this.now = [-1, -1]; //vị trí điểm hiện tại khi vẽ.
  this.width = width;
  this.height = height;

  // Xác định chỉ số pixel trên canvas
  this.getPixelIndex = function (x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return -1;
    return (x + y * width) << 2; // Dịch trái 2 bit, tương đương với (x + y * width) * 4;
  };

  // Đặt Màu cho Pixel
  this.setPixel = function (x, y, rgba) {
    pixelIndex = this.getPixelIndex(x, y);
    if (pixelIndex == -1) return;
    for (var i = 0; i < 4; i++) {
      this.imageData.data[pixelIndex + i] = rgba[i];
    }
  };

  // Vẽ Điểm
  this.drawPoint = function (p, rgba) {
    var x = p[0];
    var y = p[1];
    for (var i = -1; i <= 1; i++)
      for (var j = -1; j <= 1; j++) 
        this.setPixel(x + i, y + j, rgba);
  };

  // Vẽ Đường Thẳng bằng thuật toán DDA
  this.drawLine = function (p0, p1, rgba) {
    var x0 = p0[0], y0 = p0[1];     // x0 = X0, y0 = Y0
    var x1 = p1[0], y1 = p1[1];     // x1 = X1, y1 = Y1
    var dx = x1 - x0, dy = y1 - y0;
    if (dx == 0 && dy == 0) return;
    if (Math.abs(dy) <= Math.abs(dx)) {
      if (x1 < x0) {
        var tmpx = x0;              //swap(x0, x1)
        x0 = x1;
        x1 = tmpx;
        var tmpy = y0;              //swap(y0, y1)
        y0 = y1;
        y1 = tmpy;
      }
      var m = dy / dx;
      var y = y0;
      for (var x = x0; x <= x1; x++) {
        this.setPixel(x, Math.floor(y + 0.5), rgba);
        y = y + m;
      }
    } else {
      if (y1 < y0) {
        var tmpx = x0;
        x0 = x1;
        x1 = tmpx;
        var tmpy = y0;
        y0 = y1;
        y1 = tmpy;
      }
      var m = dx / dy;
      var x = x0;
      for (var y = y0; y <= y1; y++) {
        this.setPixel(Math.floor(x + 0.5), y, rgba);
        x = x + m;
      }
    }
  };

  //  Tô Nền
  this.drawBkg = function (rgba) {
    for (var i = 0; i < this.width; i++)
      for (var j = 0; j < this.height; j++) 
        this.setPixel(i, j, rgba);
  };

  // Xóa Canvas
  this.clear = function () {
    this.points.length = 0;
    this.lines.length = 0;  // Xóa toàn bộ đường vẽ trước đó khi reset
    this.drawBkg(bgRgba);
    this.context.putImageData(this.imageData, 0, 0);
  };

  // Thêm Điểm
  this.addPoint = function (p) {
    this.points.push(p);
    //this.allPoints.push(p);  // Lưu điểm control vào danh sách chung
  };

  // Vẽ lại Canvas
  this.draw = function (p) {
    this.drawBkg(bgRgba);
    
    // Vẽ lại tất cả các đường đã vẽ trước đó
    for (let i = 0; i < this.lines.length; i++) {
      let line = this.lines[i];
      for (let j = 0; j < line.length - 1; j++) {
        this.drawLine(line[j], line[j + 1], lineRgba);
      }
    }

    // Vẽ lại tất cả các điểm control (đỏ)
    /*
    for (let i = 0; i < this.allPoints.length; i++)
      this.drawPoint(this.allPoints[i], pointRgba);
    */

    // Vẽ các điểm và đường của đường hiện tại
    let n = this.points.length;
    for (let i = 0; i < n; i++) 
      this.drawPoint(this.points[i], pointRgba);
    for (let i = 0; i < n - 1; i++)
      this.drawLine(this.points[i], this.points[i + 1], lineRgba);
    if (n > 0 && (this.points[n - 1][0] != p[0] || this.points[n - 1][1] != p[1])) {
      this.drawLine(this.points[n - 1], p, vlineRgba);
    }

    this.context.putImageData(this.imageData, 0, 0);
  };

  this.finishLine = function () {
    if (this.points.length > 1) {
      this.lines.push([...this.points]); // Lưu đường cũ vào danh sách
    }
    this.points = []; // Xóa danh sách điểm để bắt đầu vẽ mới
  };

  this.clear();
  this.draw();
}

// Khởi tạo Trạng Thái
state = 0; // 0: waiting 1: drawing 2: finished
clickPos = [-1, -1];
var painter = new Painter_DDA(context, width, height);

// Xử lý Sự Kiện
// Chuyển đổi tọa độ chuột sang tọa độ canvas
dda_getPosOnCanvas = function (x, y) {
  var bbox = canvas.getBoundingClientRect();
  return [
    Math.floor(x - bbox.left * (canvas.width / bbox.width) + 0.5),
    Math.floor(y - bbox.top * (canvas.height / bbox.height) + 0.5),
  ];
};

// Di chuyển chuột (mousemove)
dda_doMouseMove = function (e) {
  if (state == 0 || state == 2) {
    return;
  }
  var p = dda_getPosOnCanvas(e.clientX, e.clientY);
  painter.draw(p);
};

// Nhấp chuột (mousedown)
dda_doMouseDown = function (e) {
  if (state == 2 || e.button != 0) {
    return;
  }
  var p = dda_getPosOnCanvas(e.clientX, e.clientY);

  painter.addPoint(p);
  painter.draw(p);
  
  if (state == 0) {
    state = 1;
  }

};

// Nhấn phím (keydown)
dda_doKeyDown = function (e) {
  /*
    if (state == 2) {
      return;
    }
  */
  var keyId = e.keyCode ? e.keyCode : e.which;
  if (keyId == 27 && state == 1) { // esc
    state = 2; 
    painter.draw(painter.points[painter.points.length - 1]); // clear red line
  }
  if (e.ctrlKey && state == 2) { // Ctrl
    painter.finishLine(); // Lưu đường hiện tại và bắt đầu đường mới
    state = 0; 
  }
};

// Nút Reset
dda_doReset = function () {
  if (state == 0) {
    return;
  }
  state = 0;
  painter.clear(); // Xóa toàn bộ canvas
};

canvas.addEventListener("mousedown", dda_doMouseDown, false);
canvas.addEventListener("mousemove", dda_doMouseMove, false);
window.addEventListener("keydown", dda_doKeyDown, false);

var resetButton = document.getElementById("reset");
resetButton.addEventListener("click", dda_doReset, false);

