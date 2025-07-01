// lab04.js
// Quản lý việc tải động các script fractal và hiển thị các điều khiển tương ứng.

/**
 * Hàm hiển thị modal thông báo tùy chỉnh.
 * @param {string} message - Nội dung thông báo.
 * @param {string} [title="Thông báo"] - Tiêu đề của thông báo.
 */
function showCustomAlert(message, title = "Thông báo") {
    const modal = document.getElementById('customAlertModal');
    const alertTitle = document.getElementById('alertTitle');
    const alertMessage = document.getElementById('alertMessage');
    const closeButton = document.getElementById('alertCloseButton');

    if (modal && alertTitle && alertMessage && closeButton) {
        alertTitle.innerText = title;
        alertMessage.innerText = message;
        modal.classList.remove('hidden');

        const closeHandler = () => {
            modal.classList.add('hidden');
            closeButton.removeEventListener('click', closeHandler);
        };
        closeButton.addEventListener('click', closeHandler);
    } else {
        console.error('Lỗi: Không tìm thấy các phần tử modal thông báo.');
        // Fallback to native alert if custom modal elements are missing
        alert(message);
    }
}

// Global variables to hold the current fractal's state and functions
// These will be populated by the dynamically loaded scripts
var currentFractal = {
    level: 0,
    init: null, // New init function for each fractal object
    draw: null,
    changeLevel: null,
    updateC: null, // For Julia Set
    changeStepSize: null // For Julia Set
};

// Map fractal names to their script paths and control group classes
var fractalConfigs = {
    'vankoch': {
        script: 'src/vankoch.js',
        globalObject: 'kochSnowflake',
        controlsClass: 'vankoch',
        levelDisplayId: 'levelDisplayKoch',
        decreaseButtonId: 'decreaseLevelKoch',
        increaseButtonId: 'increaseLevelKoch'
    },
    'minkowski': {
        script: 'src/minkowski.js',
        globalObject: 'minkowskiIsland',
        controlsClass: 'minkowski',
        levelDisplayId: 'levelDisplayMinkowski',
        decreaseButtonId: 'decreaseLevelMinkowski',
        increaseButtonId: 'increaseLevelMinkowski'
    },
    'sierpinskiT': {
        script: 'src/sierpinskiT.js',
        globalObject: 'sierpinskiTriangles',
        controlsClass: 'sierpinskiT',
        levelDisplayId: 'levelDisplaySierpinskiT',
        decreaseButtonId: 'decreaseLevelSierpinskiT',
        increaseButtonId: 'increaseLevelSierpinskiT'
    },
    'sierpinskiC': {
        script: 'src/sierpinskiC.js',
        globalObject: 'sierpinskiCarpet',
        controlsClass: 'sierpinskiC',
        levelDisplayId: 'levelDisplaySierpinskiC',
        decreaseButtonId: 'decreaseLevelSierpinskiC',
        increaseButtonId: 'increaseLevelSierpinskiC'
    },
    'mandelbrot': {
        script: 'src/mandelbrot.js',
        globalObject: 'mandelbrotSet',
        controlsClass: 'mandelbrot',
        levelDisplayId: 'levelDisplayMandelbrot',
        decreaseButtonId: 'decreaseLevelMandelbrot',
        increaseButtonId: 'increaseLevelMandelbrot'
    },
    'julia': {
        script: 'src/julia.js',
        globalObject: 'juliaSet',
        controlsClass: 'julia',
        realInputId: 'realJulia',
        imagInputId: 'imagJulia',
        stepSizeInputId: 'stepSizeJulia'
    }
};

var currentScriptElement = null; // To keep track of the currently loaded fractal script
var glCanvas = null; // Reference to the WebGL canvas element
var glContext = null; // The single WebGL context

// Biến toàn cục để lưu trữ các event listeners để dễ dàng loại bỏ
var fractalSelectChangeListener = null;
// Không cần biến cho nút tăng/giảm và input Julia vì chúng được gán lại trong handleChartSelectChange

/**
 * Tải động một script JavaScript và gán các hàm của nó vào `currentFractal`.
 * @param {string} scriptPath - Đường dẫn đến tệp script.
 * @param {string} fractalType - Loại fractal (ví dụ: 'vankoch', 'julia').
 */
function loadFractalScript(scriptPath, fractalType) {
    console.log(`[lab04.js] Bắt đầu tải script: ${scriptPath} cho loại fractal: ${fractalType}`);
    // Xóa script cũ nếu có
    if (currentScriptElement) {
        document.body.removeChild(currentScriptElement);
        currentScriptElement = null;
        console.log(`[lab04.js] Đã xóa script cũ.`);
    }

    // Reset currentFractal functions
    currentFractal.level = 0;
    currentFractal.init = null;
    currentFractal.draw = null;
    currentFractal.changeLevel = null;
    currentFractal.updateC = null;
    currentFractal.changeStepSize = null;
    console.log(`[lab04.js] Đã reset currentFractal.`);

    const script = document.createElement('script');
    script.src = scriptPath;
    script.onload = () => {
        console.log(`[lab04.js] Script đã tải xong: ${scriptPath}`);
        const config = fractalConfigs[fractalType];
        let fractalObject = window[config.globalObject]; // Lấy đối tượng toàn cục

        if (fractalObject) {
            console.log(`[lab04.js] Tìm thấy đối tượng fractal: ${config.globalObject}`);
            // Khởi tạo WebGL context nếu chưa có
            if (!glContext) {
                glContext = glCanvas.getContext("webgl");
                if (!glContext) {
                    showCustomAlert("WebGL không được hỗ trợ trên trình duyệt này.", "Lỗi WebGL");
                    console.error("[lab04.js] WebGL không được hỗ trợ.");
                    return;
                }
                console.log("[lab04.js] Đã khởi tạo ngữ cảnh WebGL.");
            }

            // Gán ngữ cảnh gl cho đối tượng fractal và khởi tạo
            // Mỗi fractal object có thể có hàm init riêng để thiết lập shaders, buffers...
            if (fractalObject.init) {
                fractalObject.init(glContext);
                console.log(`[lab04.js] Đã gọi init cho ${config.globalObject}.`);
            } else {
                console.warn(`[lab04.js] Đối tượng fractal ${config.globalObject} không có hàm init.`);
            }

            // Gán các hàm từ đối tượng fractal đã tải vào currentFractal
            currentFractal.init = fractalObject.init.bind(fractalObject);
            currentFractal.draw = fractalObject.draw.bind(fractalObject);
            currentFractal.changeLevel = fractalObject.changeLevel ? fractalObject.changeLevel.bind(fractalObject) : null;
            currentFractal.updateC = fractalObject.updateC ? fractalObject.updateC.bind(fractalObject) : null;
            currentFractal.changeStepSize = fractalObject.changeStepSize ? fractalObject.changeStepSize.bind(fractalObject) : null;

            currentFractal.level = fractalObject.level || 0; // Đồng bộ cấp độ ban đầu, mặc định là 0
            console.log(`[lab04.js] Đã gán các hàm fractal vào currentFractal với bind.`);

            // Cập nhật hiển thị cấp độ ban đầu
            if (fractalType !== 'julia') {
                const levelDisplay = document.getElementById(config.levelDisplayId);
                if (levelDisplay) {
                    levelDisplay.innerText = currentFractal.level;
                    console.log(`[lab04.js] Cập nhật hiển thị level: ${currentFractal.level}`);
                }
            } else {
                // Đặt giá trị mặc định cho Julia Set và cập nhật
                const realInput = document.getElementById(config.realInputId);
                const imagInput = document.getElementById(config.imagInputId);
                const stepSizeInput = document.getElementById(config.stepSizeInputId);

                if (realInput && imagInput) {
                    // Cập nhật giá trị mặc định chỉ khi cần thiết
                    if (parseFloat(realInput.value) !== -0.05 || parseFloat(imagInput.value) !== 0.0) {
                        realInput.value = -0.05;
                        imagInput.value = 0.0;
                    }
                    if (currentFractal.updateC) {
                        currentFractal.updateC(parseFloat(realInput.value), parseFloat(imagInput.value));
                        console.log(`[lab04.js] Đã cập nhật C cho Julia: (${realInput.value}, ${imagInput.value})`);
                    }
                }
                if (stepSizeInput) {
                    if (parseFloat(stepSizeInput.value) !== 0.05) {
                        stepSizeInput.value = 0.05;
                    }
                    if (currentFractal.changeStepSize) {
                        currentFractal.changeStepSize(parseFloat(stepSizeInput.value));
                        console.log(`[lab04.js] Đã cập nhật Step Size cho Julia: ${stepSizeInput.value}`);
                    }
                }
            }

            // Vẽ fractal lần đầu
            if (currentFractal.draw) {
                currentFractal.draw();
                console.log(`[lab04.js] Đã gọi hàm draw cho fractal hiện tại.`);
            } else {
                console.error(`[lab04.js] Hàm draw không khả dụng cho ${fractalType}.`);
            }

        } else {
            console.error(`[lab04.js] Đối tượng fractal cho ${fractalType} không tìm thấy sau khi tải script.`);
        }
    };
    script.onerror = () => {
        console.error(`[lab04.js] Lỗi khi tải script: ${scriptPath}`);
        showCustomAlert(`Không thể tải tệp script: ${scriptPath}. Vui lòng kiểm tra đường dẫn và tên tệp.`, "Lỗi tải Script");
    };
    document.body.appendChild(script);
    currentScriptElement = script;
}

/**
 * Xử lý sự kiện thay đổi lựa chọn fractal từ dropdown.
 */
function handleChartSelectChange() {
    console.log("[lab04.js] Xử lý thay đổi lựa chọn biểu đồ.");
    const selectElement = document.getElementById('fractal-select');
    const selectedFractal = selectElement.value;
    console.log(`[lab04.js] Fractal được chọn: ${selectedFractal}`);

    // Ẩn tất cả các nhóm điều khiển
    document.querySelectorAll('.control-group').forEach(group => {
        group.classList.add('hidden');
    });
    console.log("[lab04.js] Đã ẩn tất cả các nhóm điều khiển.");

    // Hiển thị nhóm điều khiển cho fractal được chọn
    const config = fractalConfigs[selectedFractal];
    if (config) {
        const controlsDiv = document.querySelector(`.${config.controlsClass}`);
        if (controlsDiv) {
            controlsDiv.classList.remove('hidden');
            console.log(`[lab04.js] Hiển thị nhóm điều khiển: ${config.controlsClass}`);
        }

        // Tải script và khởi tạo fractal
        loadFractalScript(config.script, selectedFractal);

        // Gắn lại các trình xử lý sự kiện cho các nút điều khiển cấp độ (nếu có)
        // Đảm bảo xóa các listener cũ trước khi gắn lại
        if (selectedFractal !== 'julia') {
            const decreaseButton = document.getElementById(config.decreaseButtonId);
            const increaseButton = document.getElementById(config.increaseButtonId);

            if (decreaseButton) {
                decreaseButton.onclick = null; // Xóa trình nghe sự kiện cũ
                decreaseButton.onclick = () => {
                    if (currentFractal.changeLevel) {
                        currentFractal.changeLevel(-1);
                        console.log(`[lab04.js] Nút giảm level được nhấn cho ${selectedFractal}.`);
                    }
                };
            }
            if (increaseButton) {
                increaseButton.onclick = null; // Xóa trình nghe sự kiện cũ
                increaseButton.onclick = () => {
                    if (currentFractal.changeLevel) {
                        currentFractal.changeLevel(1);
                        console.log(`[lab04.js] Nút tăng level được nhấn cho ${selectedFractal}.`);
                    }
                };
            }
        } else { // Julia Set specific controls
            const realInput = document.getElementById(config.realInputId);
            const imagInput = document.getElementById(config.imagInputId);
            const stepSizeInput = document.getElementById(config.stepSizeInputId);

            if (realInput && imagInput) {
                realInput.oninput = null; // Xóa trình nghe sự kiện cũ
                imagInput.oninput = null; // Xóa trình nghe sự kiện cũ
                const updateJulia = () => {
                    if (currentFractal.updateC) {
                        currentFractal.updateC(parseFloat(realInput.value), parseFloat(imagInput.value));
                        console.log(`[lab04.js] Input Julia C được thay đổi: (${realInput.value}, ${imagInput.value}).`);
                    }
                };
                realInput.oninput = updateJulia;
                imagInput.oninput = updateJulia;
            }
            if (stepSizeInput) {
                stepSizeInput.oninput = null; // Xóa trình nghe sự kiện cũ
                stepSizeInput.oninput = () => {
                    if (currentFractal.changeStepSize) {
                        currentFractal.changeStepSize(parseFloat(stepSizeInput.value));
                        console.log(`[lab04.js] Input Step Size Julia được thay đổi: ${stepSizeInput.value}.`);
                    }
                };
            }
        }
    } else {
        console.error(`[lab04.js] Không tìm thấy cấu hình cho fractal: ${selectedFractal}`);
    }
}

// --- Hàm khởi tạo và dọn dẹp cho Lab 04 (được gọi từ main.js) ---

/**
 * Hàm khởi tạo chính cho Lab 04. Được gọi từ main.js khi Lab 04 được chọn.
 */
window.initLab04 = function() {
    console.log("[lab04.js] initLab04 được gọi.");
    glCanvas = document.getElementById("glCanvas");
    if (!glCanvas) {
        console.error('Lỗi: Không tìm thấy phần tử canvas #glCanvas khi initLab04.');
        showCustomAlert("Không tìm thấy phần tử canvas WebGL. Vui lòng đảm bảo ID là 'glCanvas'.", "Lỗi HTML");
        return;
    }
    console.log("[lab04.js] Đã tìm thấy canvas #glCanvas trong initLab04.");

    const selectElement = document.getElementById('fractal-select');
    if (selectElement) {
        // Gắn lại listener mỗi khi initLab04 được gọi để đảm bảo nó chỉ có một
        if (fractalSelectChangeListener) {
            selectElement.removeEventListener('change', fractalSelectChangeListener);
        }
        fractalSelectChangeListener = handleChartSelectChange; // Lưu tham chiếu
        selectElement.addEventListener('change', fractalSelectChangeListener);
        console.log("[lab04.js] Đã thêm trình nghe sự kiện cho dropdown #fractal-select trong initLab04.");

        // Hiển thị container chính sau khi mọi thứ được thiết lập
        const container = document.querySelector('.container-lab04');
        if (container) {
            container.classList.remove('hidden');
            console.log("[lab04.js] Đã hiển thị container-lab04.");
        }

        // Tải fractal mặc định khi lab04 được khởi tạo
        // Điều này sẽ kích hoạt việc tải script fractal ban đầu và vẽ.
        handleChartSelectChange();
    } else {
        console.error('Lỗi: Không tìm thấy phần tử dropdown #fractal-select khi initLab04.');
        showCustomAlert("Không tìm thấy phần tử dropdown lựa chọn biểu đồ. Vui lòng đảm bảo ID là 'fractal-select'.", "Lỗi HTML");
    }
};

/**
 * Hàm dọn dẹp cho Lab 04. Được gọi từ main.js khi rời khỏi Lab 04.
 */
window.cleanupLab04 = function() {
    console.log("[lab04.js] cleanupLab04 được gọi.");

    // Xóa script fractal hiện tại
    if (currentScriptElement) {
        document.body.removeChild(currentScriptElement);
        currentScriptElement = null;
        console.log(`[lab04.js] Đã xóa script fractal cũ.`);
    }

    // Đặt lại trạng thái của WebGL context
    if (glContext) {
        // Đặt lại màu nền về mặc định hoặc màu bạn muốn khi không có fractal
        glContext.clearColor(0.0, 0.0, 0.0, 0.0); // Màu đen trong suốt
        glContext.clear(glContext.COLOR_BUFFER_BIT);
        glContext.useProgram(null); // Ngừng sử dụng chương trình shader
        console.log("[lab04.js] Đã dọn dẹp ngữ cảnh WebGL.");
        // Lưu ý: Không nên giải phóng glContext hoàn toàn nếu các lab khác cũng dùng WebGL.
        // Nếu chỉ Lab04 sử dụng WebGL, bạn có thể cân nhắc hủy context để giải phóng tài nguyên GPU.
        // Tuy nhiên, việc này phức tạp hơn và thường không cần thiết trừ khi bạn quản lý nhiều context.
    }

    // Xóa các event listener chính để tránh rò rỉ bộ nhớ
    const selectElement = document.getElementById('fractal-select');
    if (selectElement && fractalSelectChangeListener) {
        selectElement.removeEventListener('change', fractalSelectChangeListener);
        fractalSelectChangeListener = null; // Reset biến tham chiếu
        console.log("[lab04.js] Đã xóa trình nghe sự kiện cho dropdown.");
    }

    // Xóa các event listener của nút level/input Julia
    // Duyệt qua tất cả các config để đảm bảo dọn dẹp mọi nút/input đã được gán onlick/oninput
    for (const type in fractalConfigs) {
        const config = fractalConfigs[type];
        if (config.decreaseButtonId && document.getElementById(config.decreaseButtonId)) {
            document.getElementById(config.decreaseButtonId).onclick = null;
        }
        if (config.increaseButtonId && document.getElementById(config.increaseButtonId)) {
            document.getElementById(config.increaseButtonId).onclick = null;
        }
        if (config.realInputId && document.getElementById(config.realInputId)) {
            document.getElementById(config.realInputId).oninput = null;
        }
        if (config.imagInputId && document.getElementById(config.imagInputId)) {
            document.getElementById(config.imagInputId).oninput = null;
        }
        if (config.stepSizeInputId && document.getElementById(config.stepSizeInputId)) {
            document.getElementById(config.stepSizeInputId).oninput = null;
        }
    }
    console.log("[lab04.js] Đã xóa các trình nghe sự kiện của điều khiển fractal.");

    // Reset currentFractal state về trạng thái ban đầu
    currentFractal = {
        level: 0,
        init: null,
        draw: null,
        changeLevel: null,
        updateC: null,
        changeStepSize: null
    };
    console.log("[lab04.js] Đã reset currentFractal state.");
};
