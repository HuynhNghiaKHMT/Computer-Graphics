document.addEventListener("DOMContentLoaded", function () {
    // Lấy các nút bấm và container chứa script
    const buttons = document.querySelectorAll(".shape button");
    const scriptContainer = document.getElementById("script-container");
    const defaultButton = document.getElementById("dda");
    const canvas = document.getElementById("canvas");

    // Biến lưu trữ các event listener hiện tại
    let currentEventListeners = {};

    // Hàm dọn dẹp canvas và gỡ bỏ event listeners
    function cleanup() {
        // Xóa nội dung canvas
        if (canvas) {
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        // Gỡ bỏ các event listeners
        removeEventListeners();

        // Xóa các biến toàn cục liên quan đến vẽ
        delete window.painter;
        delete window.state;
        delete window.clickPos;

        // Xóa script cũ
        scriptContainer.innerHTML = "";
    }

    // Hàm gỡ bỏ các event listeners hiện tại
    function removeEventListeners() {
        for (const event in currentEventListeners) {
            canvas.removeEventListener(event, currentEventListeners[event], false);
            window.removeEventListener(event, currentEventListeners[event], false);
        }
        currentEventListeners = {};
    }
    // Hàm thêm các event listeners
    function addEventListeners(eventListeners) {
        currentEventListeners = eventListeners;
        for (const event in currentEventListeners) {
            canvas.addEventListener(event, currentEventListeners[event], false);
            if (event === "keydown") {
                window.addEventListener(event, currentEventListeners[event], false);
            }
        }
    }
    // Hàm tải script và gọi callback khi tải xong
    function loadScript(scriptSrc, callback) {
        cleanup();

        const script = document.createElement("script");
        script.src = scriptSrc;
        script.type = "text/javascript";
        script.onload = function () {
            console.log(`Loaded: ${scriptSrc}`);
            if (callback) {
                callback();
            }
        };
        scriptContainer.appendChild(script);
    }

    // Tải script mặc định (dda.js) và gán event listeners
    defaultButton.classList.add("active");
    loadScript("src/dda.js", () => {
        addEventListeners({
            mousedown: dda_doMouseDown,
            mousemove: dda_doMouseMove,
            keydown: dda_doKeyDown,
        });
    });
    
    // Xử lý sự kiện click cho các nút bấm
    buttons.forEach(button => {
        button.addEventListener("click", function () {
            buttons.forEach(btn => btn.classList.remove("active"));
            this.classList.add("active");

            if (this.id === "dda") {
                loadScript("src/dda.js", () => {
                    addEventListeners({
                        mousedown: dda_doMouseDown,
                        mousemove: dda_doMouseMove,
                        keydown: dda_doKeyDown,
                    });
                });
            } else if (this.id === "bresenham") {
                loadScript("src/bresenham.js", () => {
                    addEventListeners({
                        mousedown: bresenham_doMouseDown,
                        mousemove: bresenham_doMouseMove,
                        keydown: bresenham_doKeyDown,
                    });
                });
            } else if (this.id === "midpoint") {
                loadScript("src/midpoint.js", () => {
                    addEventListeners({
                        mousedown: midpoint_doMouseDown,
                        mousemove: midpoint_doMouseMove,
                        mouseup: midpoint_doMouseUp,
                        keydown: midpoint_doKeyDown,
                    });
                });
            } else if (this.id === "ellipse") {
                loadScript("src/ellipse.js", () => {

                });
            }
        });
    });
});