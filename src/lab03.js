// lab03.js

document.addEventListener("DOMContentLoaded", function () {
    const select = document.getElementById("chart-select");
    const innerContainers = document.querySelectorAll(".graph, .grapht, .bezier, .hermite");
    let currentScript = null;
    let currentScriptBaseName = null; // Thêm biến này để theo dõi script đang hoạt động

    // Hàm updateValue toàn cục
    window.updateValue = function(spanId, value) {
        const spanElement = document.getElementById(spanId);
        if (spanElement) {
            spanElement.textContent = value;
        } else {
            console.warn(`[lab03.js] Span element with ID '${spanId}' not found.`);
        }
    };

    function loadScript(scriptBaseName) {
        const canvas = document.getElementById("canvas-lab03");
        if (canvas) {
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Xóa canvas
        } else {
            console.warn("[lab03.js] Canvas element with ID 'canvas-lab03' not found for Lab03.");
        }

        // --- Bổ sung logic Cleanup cho script cũ ---
        if (currentScriptBaseName) {
            const cleanupFuncName = `cleanup${currentScriptBaseName.charAt(0).toUpperCase() + currentScriptBaseName.slice(1)}`;
            if (typeof window[cleanupFuncName] === 'function') {
                window[cleanupFuncName]();
                console.log(`[lab03.js] Calling cleanup for: lab03-${currentScriptBaseName}.js`);
            }
        }
        // --- Hết logic Cleanup ---

        if (currentScript) {
            if (currentScript.parentNode) {
                console.log(`[lab03.js] Removing script: ${currentScript.src.split('/').pop()}`);
                currentScript.parentNode.removeChild(currentScript);
            }
        }

        const script = document.createElement("script");
        script.src = `src/lab03-${scriptBaseName}.js`; 
        script.onload = () => {
            console.log(`[lab03.js] Loaded script: ${script.src.split('/').pop()}`);
            
            // --- Bổ sung logic Initialization cho script mới ---
            const initFuncName = `init${scriptBaseName.charAt(0).toUpperCase() + scriptBaseName.slice(1)}`;
            if (typeof window[initFuncName] === 'function') {
                window[initFuncName]();
            } else {
                console.warn(`[lab03.js] Initialization function '${initFuncName}' not found for ${script.src.split('/').pop()}`);
            }
            // --- Hết logic Initialization ---
        };
        script.onerror = () => {
            console.error(`[lab03.js] Failed to load script: ${script.src.split('/').pop()}`);
        };
        document.body.appendChild(script);
        currentScript = script;
        currentScriptBaseName = scriptBaseName; // Cập nhật script đang hoạt động
    }

    function updateDisplay() {
        innerContainers.forEach(div => div.style.display = "none"); // Hide all inner containers

        const selectedValue = select.value;
        const selectedContainer = document.querySelector("." + selectedValue);
        
        if (selectedContainer) {
            selectedContainer.style.display = "block"; 
        } else {
            console.warn(`[lab03.js] Inner container with class "${selectedValue}" not found.`);
        }

        // Tải script dựa trên giá trị đã chọn
        switch (selectedValue) {
            case "graph":
                loadScript("graph");
                break;
            case "grapht":
                loadScript("grapht");
                break;
            case "bezier":
                loadScript("bezier");
                break;
            case "hermite":
                loadScript("hermite");
                break;
            default:
                console.warn("[lab03.js] Unknown chart type selected:", selectedValue);
        }
    }

    select.addEventListener("change", updateDisplay);
    
    // --- Hàm khởi tạo và dọn dẹp chính cho Lab03 ---
    window.initLab03 = function () {
        console.log("[lab03.js] Initializing Lab 03...");
        // Khởi tạo các biến trạng thái chung cho Lab03 nếu có
        window.lab03State = {}; 
        updateDisplay(); // Gọi lần đầu để hiển thị đồ thị mặc định
    };

    window.cleanupLab03 = function () {
        console.log("[lab03.js] Cleanup function for Lab 03 called.");

        // Dọn dẹp script con hiện tại trước
        if (currentScriptBaseName) {
            const cleanupFuncName = `cleanup${currentScriptBaseName.charAt(0).toUpperCase() + currentScriptBaseName.slice(1)}`;
            if (typeof window[cleanupFuncName] === 'function') {
                window[cleanupFuncName]();
                console.log(`[lab03.js] Calling cleanup for: lab03-${currentScriptBaseName}.js`);
            }
        }

        // Xóa script element khỏi DOM
        if (currentScript && currentScript.parentNode) {
            console.log(`[lab03.js] Removing script: ${currentScript.src.split('/').pop()}`);
            currentScript.parentNode.removeChild(currentScript);
        }
        currentScript = null;
        currentScriptBaseName = null;

        // Dọn dẹp canvas chính của Lab03
        const canvas = document.getElementById("canvas-lab03");
        if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }

        // Reset toàn bộ đối tượng trạng thái của Lab03
        window.lab03State = {}; 
        console.log("[lab03.js] Lab 03 cleanup complete, state reset.");
    };

}); // End DOMContentLoaded