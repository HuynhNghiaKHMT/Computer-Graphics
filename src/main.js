// main.js
document.addEventListener("DOMContentLoaded", function () {
    const labLinksContainer = document.querySelector(".labs-option");
    const containerDivs = document.querySelectorAll(".container > div[class^='container-lab']");
    const labTitle = document.getElementById("lab-title");
    const head = document.querySelector("head");

    let currentScriptElements = []; // Để theo dõi tất cả các script đã tải động
    let currentStyle = null; // Để theo dõi stylesheet hiện tại
    let currentLabCleanupFunction = null; // Để lưu hàm cleanup của lab hiện tại

    // Cấu hình các script và style cho mỗi lab
    const labResources = {
        "lab01": {
            style: "lab01.css",
            scripts: ["lab01.js"]
        },
        "lab02": {
            style: "lab02.css",
            // Thứ tự tải script là CỰC KỲ QUAN TRỌNG cho Lab02
            scripts: ["webgl-utils.js", "webgl-lessons-ui.js", "lab02-shaders.js","lab02.js"]
        },
        "lab03": {
            style: "lab03.css",
            scripts: ["lab03.js"]
        },
        "lab04": {
            // Placeholder: Thêm style và scripts khi có
            style: "lab04.css",
            scripts: ["lab04.js"]
        },
        "lab05": {
            style: "lab05.css",
            scripts: ["lab05.js"],
            scriptTypes: { "lab05.js": "module" } // Chỉ định type="module" cho lab05.js
        },
        "lab06": {
            // Placeholder: Thêm style và scripts khi có
            style: "lab06.css",
            scripts: ["lab06.js"],
            scriptTypes: { "lab06.js": "module" }
        },
        "lab07": {
            // Placeholder: Thêm style và scripts khi có
            style: "lab07.css",
            scripts: ["lab07.js"],
            scriptTypes: { "lab07.js": "module" }
        }
    };


    // Function to remove all lab-specific scripts and styles
    function removeDynamicLabResources() {
        // Gọi hàm cleanup của lab hiện tại trước khi gỡ bỏ script/style
        if (currentLabCleanupFunction && typeof currentLabCleanupFunction === 'function') {
            console.log(`[main.js] Calling cleanup function for previous lab.`);
            currentLabCleanupFunction();
        }

        // Gỡ bỏ tất cả các script đã tải động
        currentScriptElements.forEach(script => {
            console.log(`[main.js] Removing old script: ${script.src.split('/').pop()}`);
            script.remove();
        });
        currentScriptElements = []; // Reset mảng các script đã tải

        // Gỡ bỏ stylesheet hiện tại
        if (currentStyle) {
            console.log(`[main.js] Removing old style: ${currentStyle.href.split('/').pop()}`);
            currentStyle.remove();
            currentStyle = null;
        }
        currentLabCleanupFunction = null; // Reset hàm cleanup
    }

    /**
     * Tải các tài nguyên (CSS và JS) cho một Lab cụ thể.
     * @param {string} labId ID của lab (ví dụ: "lab01", "lab02").
     */
    function loadLabResources(labId) {
        removeDynamicLabResources(); // Dọn dẹp tài nguyên của lab trước

        const resources = labResources[labId];
        if (!resources) {
            console.warn(`[main.js] No resources defined for ${labId}`);
            return;
        }

        // Tải CSS
        if (resources.style) {
            const newStyle = document.createElement("link");
            newStyle.href = `style/${resources.style}`;
            newStyle.rel = "stylesheet";
            newStyle.type = "text/css";
            newStyle.onload = () => {
                currentStyle = newStyle;
                console.log(`[main.js] Loaded style: ${newStyle.href.split('/').pop()}`);
            };
            newStyle.onerror = () => {
                console.error(`[main.js] Failed to load style: ${newStyle.href.split('/').pop()}`);
            };
            head.appendChild(newStyle);
        }

        // Tải JavaScripts tuần tự
        let scriptIndex = 0;
        function loadNextScript() {
            if (scriptIndex < resources.scripts.length) {
                const scriptFileName = resources.scripts[scriptIndex];
                const newScript = document.createElement("script");
                newScript.src = `src/${scriptFileName}`;
                // Xác định type của script (mặc định là "text/javascript", có thể là "module")
                newScript.type = resources.scriptTypes && resources.scriptTypes[scriptFileName]
                                 ? resources.scriptTypes[scriptFileName]
                                 : "text/javascript";

                newScript.onload = () => {
                    console.log(`[main.js] Loaded script: ${newScript.src.split('/').pop()}`);
                    currentScriptElements.push(newScript); // Lưu tham chiếu đến script đã tải
                    scriptIndex++;
                    loadNextScript(); // Tải script tiếp theo
                };
                newScript.onerror = () => {
                    console.error(`[main.js] Failed to load script: ${newScript.src.split('/').pop()}`);
                    scriptIndex++; // Vẫn cố gắng tải script tiếp theo ngay cả khi có lỗi
                    loadNextScript();
                };
                document.body.appendChild(newScript);
            } else {
                // Tất cả các script đã được tải, gọi hàm khởi tạo của Lab
                const initFuncName = `init${labId.charAt(0).toUpperCase() + labId.slice(1)}`; // Ví dụ: initLab02
                const cleanupFuncName = `cleanup${labId.charAt(0).toUpperCase() + labId.slice(1)}`; // Ví dụ: cleanupLab02

                if (typeof window[initFuncName] === 'function') {
                    window[initFuncName]();
                    currentLabCleanupFunction = window[cleanupFuncName]; // Lưu hàm cleanup
                    console.log(`[main.js] Called initialization function: ${initFuncName}`);
                } else {
                    console.warn(`[main.js] Initialization function ${initFuncName} not found for ${labId}`);
                }
            }
        }
        loadNextScript(); // Bắt đầu tải script đầu tiên trong danh sách
    }

    /**
     * Hiển thị container của lab được chọn và ẩn các lab khác.
     * @param {number} labNumber Số của lab (ví dụ: 1 cho Lab 01).
     */
    function showLabContainer(labNumber) {
        containerDivs.forEach(container => {
            const containerLabClass = `container-lab0${labNumber}`;
            if (container.classList.contains(containerLabClass)) {
                container.classList.remove("hidden"); // Hiện container này
            } else {
                container.classList.add("hidden"); // Ẩn các container khác
            }
        });
    }

    /**
     * Cập nhật trạng thái "active" cho liên kết lab trong header.
     * @param {string} selectedLabId ID của lab được chọn (ví dụ: "lab01").
     */
    function setActiveLabLink(selectedLabId) {
        document.querySelectorAll(".labs-option p").forEach(link => {
            link.classList.remove("active-lab-link");
        });
        document.getElementById(selectedLabId).classList.add("active-lab-link");
    }

    // Tải trang ban đầu: Thiết lập Lab 01 là active
    showLabContainer(7); // Đảm bảo container lab01 hiển thị
    setActiveLabLink("lab07"); // Đảm bảo liên kết lab01 active
    loadLabResources("lab07"); // Tải tài nguyên cho Lab01 ngay khi trang tải

    // Lắng nghe sự kiện click trên các liên kết lab trong header
    labLinksContainer.addEventListener("click", function (event) {
        const target = event.target;
        if (target.tagName === "P" && target.classList.contains("hover")) {
            const selectedLabId = target.id; // Ví dụ: "lab01", "lab02"
            const labNumber = parseInt(selectedLabId.replace('lab', ''));

            setActiveLabLink(selectedLabId);
            showLabContainer(labNumber);

            // // Cập nhật tiêu đề chính của lab
            // switch (selectedLabId) {
            //     case "lab01":
            //         labTitle.textContent = "Raster";
            //         break;
            //     case "lab023":
            //         labTitle.textContent = "Affine transformation (2D)";
            //         break;
            //     case "lab03":
            //         labTitle.textContent = "Curve";
            //         break;
            //     case "lab04":
            //         labTitle.textContent = "Fractal";
            //         break;
            //     case "lab05":
            //         labTitle.textContent = "Affine transformation (3D)";
            //         break;
            //     case "lab06":
            //         labTitle.textContent = "Observational transformation";
            //         break;
            //     case "lab07":
            //         labTitle.textContent = "Lighting & Texture";
            //         break;
            //     default:
            //         labTitle.textContent = "Computer Graphic Lab";
            // }

            // Tải tài nguyên cho lab được chọn
            loadLabResources(selectedLabId);
        }
    });
});