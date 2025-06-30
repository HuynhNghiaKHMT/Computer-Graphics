// Hàm cleanup chính cho Lab01
window.cleanupLab01 = function () {
    console.log("Cleanup function for Lab01 called.");

    if (window.lab01State && window.lab01State.lab01Canvas) {
        const ctx = window.lab01State.lab01Canvas.getContext("2d");
        ctx.clearRect(0, 0, window.lab01State.lab01Canvas.width, window.lab01State.lab01Canvas.height);
        window.lab01State.lab01Canvas.width = window.lab01State.lab01Canvas.width; // Hacky way to clear all canvas state
    }
    lab01RemoveEventListeners();

    // Gỡ bỏ script con hiện tại nếu có
    if (window.lab01State && window.lab01State.lab01CurrentLoadedScript && window.lab01State.lab01ScriptContainer) {
        console.log(`Removing script: ${window.lab01State.lab01CurrentLoadedScript.src.split('/').pop()}`);
        window.lab01State.lab01ScriptContainer.removeChild(window.lab01State.lab01CurrentLoadedScript);
        window.lab01State.lab01CurrentLoadedScript = null;
    }

    // Xóa các biến toàn cục mà các script con có thể đã tạo
    delete window.painter;
    delete window.state;
    delete window.clickPos;

    // Gỡ bỏ event listener của select box nếu tồn tại
    if (window.lab01State && window.lab01State.lab01AlgorithmSelect) {
        window.lab01State.lab01AlgorithmSelect.removeEventListener("change", lab01HandleAlgorithmChange);
    }
    
    // Đặt lại toàn bộ đối tượng trạng thái của Lab01
    // Kiểm tra xem window.lab01State có tồn tại không trước khi gán lại
    if (window.lab01State) {
        window.lab01State = {}; 
        console.log("Lab01State reset.");
    }
};

function lab01RemoveEventListeners() {
    // Chỉ thực hiện nếu window.lab01State và lab01CurrentEventListeners tồn tại
    if (!window.lab01State || !window.lab01State.lab01CurrentEventListeners) return;

    for (const event in window.lab01State.lab01CurrentEventListeners) {
        if (event === "keydown") {
            window.removeEventListener(event, window.lab01State.lab01CurrentEventListeners[event], false);
        } else {
            if (window.lab01State.lab01Canvas) {
                window.lab01State.lab01Canvas.removeEventListener(event, window.lab01State.lab01CurrentEventListeners[event], false);
            }
        }
    }
    window.lab01State.lab01CurrentEventListeners = {};
}

function lab01AddEventListeners(eventListenersConfig) {
    lab01RemoveEventListeners(); // Luôn gỡ bỏ listener cũ trước khi thêm mới
    window.lab01State.lab01CurrentEventListeners = {};
    for (const eventType in eventListenersConfig) {
        const functionName = eventListenersConfig[eventType];
        const handler = window[functionName]; // Các hàm handler như dda_doMouseDown vẫn ở global scope

        if (typeof handler === 'function') {
            if (eventType === "keydown") {
                window.addEventListener(eventType, handler, false);
            } else {
                if (window.lab01State.lab01Canvas) {
                    window.lab01State.lab01Canvas.addEventListener(eventType, handler, false);
                }
            }
            window.lab01State.lab01CurrentEventListeners[eventType] = handler;
        } else {
            console.warn(`Handler function "${functionName}" not found for event "${eventType}" in Lab01.`);
        }
    }
}

function lab01UpdateAlgorithmImage(algorithmId) {
    const imagePath = `img/${algorithmId}.png`;
    if (window.lab01State && window.lab01State.lab01AlgorithmImage) {
        window.lab01State.lab01AlgorithmImage.src = imagePath;
        window.lab01State.lab01AlgorithmImage.alt = `${algorithmId} algorithm visualization`;
    }
}

function lab01LoadChildScript(algorithmId, callback) {
    // Luôn dọn dẹp môi trường trước khi tải script mới
    if (window.lab01State && window.lab01State.lab01CurrentLoadedScript && window.lab01State.lab01ScriptContainer) {
        console.log(`Removing script: ${window.lab01State.lab01CurrentLoadedScript.src.split('/').pop()}`);
        window.lab01State.lab01ScriptContainer.removeChild(window.lab01State.lab01CurrentLoadedScript);
        window.lab01State.lab01CurrentLoadedScript = null;
    }
    
    // Cũng xóa các biến toàn cục từ script cũ
    delete window.painter;
    delete window.state;
    delete window.clickPos;

    const scriptSrc = `src/lab01-${algorithmId}.js`;
    const script = document.createElement("script");
    script.src = scriptSrc;
    script.type = "text/javascript";
    script.onload = function () {
        console.log(`Loaded script: ${scriptSrc.split('/').pop()}`);
        window.lab01State.lab01CurrentLoadedScript = script; // Lưu tham chiếu đến script con đã tải
        lab01UpdateAlgorithmImage(algorithmId);
        const config = window.lab01State.lab01AlgorithmConfigs[algorithmId]; // Thay đổi ở đây
        if (config && config.events) {
            lab01AddEventListeners(config.events);
        }
        if (callback) {
            callback();
        }
    };
    script.onerror = function () {
        console.error(`Failed to load child script for Lab01: ${scriptSrc}`);
    };
    if (window.lab01State && window.lab01State.lab01ScriptContainer) {
        window.lab01State.lab01ScriptContainer.appendChild(script);
    }
}

function lab01HandleAlgorithmChange() {
    // 'this' ở đây là lab01AlgorithmSelect
    const selectedAlgorithm = this.value; 
    const config = window.lab01State.lab01AlgorithmConfigs[selectedAlgorithm]; // Thay đổi ở đây

    if (config) {
        lab01LoadChildScript(selectedAlgorithm);
    } else {
        lab01RemoveEventListeners(); // Nếu không có config, chỉ gỡ bỏ listeners
    }
}

// Hàm khởi tạo chính cho Lab01, được gọi từ main.js
window.initLab01 = function () {
    console.log("Initialization function for Lab01 called.");

    // Đảm bảo window.lab01State được khởi tạo mỗi lần initLab01 được gọi
    window.lab01State = window.lab01State || {}; // Khởi tạo nếu chưa tồn tại
    
    // Đặt cấu hình thuật toán vào trong đối tượng trạng thái
    window.lab01State.lab01AlgorithmConfigs = {
        "dda": {
            events: {
                mousedown: "dda_doMouseDown",
                mousemove: "dda_doMouseMove",
                keydown: "dda_doKeyDown",
            }
        },
        "bresenham": {
            events: {
                mousedown: "bresenham_doMouseDown",
                mousemove: "bresenham_doMouseMove",
                keydown: "bresenham_doKeyDown",
            }
        },
        "midpoint": {
            events: {
                mousedown: "midpoint_doMouseDown",
                mousemove: "midpoint_doMouseMove",
                mouseup: "midpoint_doMouseUp",
                keydown: "midpoint_doKeyDown",
            }
        },
        "ellipse": {
            events: {
                mousedown: "ellipse_doMouseDown",
                mousemove: "ellipse_doMouseMove",
                mouseup: "ellipse_doMouseUp",
                keydown: "ellipse_doKeyDown",
            }
        }
    };

    // Gán các phần tử DOM và trạng thái khác vào đối tượng
    window.lab01State.lab01AlgorithmSelect = document.getElementById("algorithm-select");
    window.lab01State.lab01ScriptContainer = document.getElementById("script-container");
    window.lab01State.lab01Canvas = document.getElementById("canvas-lab01");
    window.lab01State.lab01AlgorithmImage = document.getElementById("algorithm-image");
    window.lab01State.lab01CurrentEventListeners = {};
    window.lab01State.lab01CurrentLoadedScript = null;

    if (window.lab01State.lab01AlgorithmSelect) {
        // Gỡ bỏ listener cũ trước để tránh trùng lặp khi init lại
        window.lab01State.lab01AlgorithmSelect.removeEventListener("change", lab01HandleAlgorithmChange); 
        window.lab01State.lab01AlgorithmSelect.addEventListener("change", lab01HandleAlgorithmChange);
    }

    // Tải script ban đầu (mặc định là DDA)
    lab01LoadChildScript(window.lab01State.lab01AlgorithmSelect ? window.lab01State.lab01AlgorithmSelect.value : "dda");
};