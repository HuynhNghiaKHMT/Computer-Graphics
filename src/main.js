document.addEventListener("DOMContentLoaded", function () {
    const buttons = document.querySelectorAll(".shape button");
    const scriptContainer = document.getElementById("script-container");
    const defaultButton = document.getElementById("dda"); // Button mặc định


    function loadScript(scriptSrc) {
        // Xóa script cũ
        if (scriptContainer.firstChild) {
            scriptContainer.removeChild(scriptContainer.firstChild);
        }

        // Tạo script mới
        const script = document.createElement("script");
        script.src = scriptSrc;
        script.type = "text/javascript";
        scriptContainer.appendChild(script);
    }

    // Đặt DDA làm mặc định khi trang load
    defaultButton.classList.add("active");
    loadScript("src/dda.js");

    buttons.forEach(button => {
        button.addEventListener("click", function () {
            // Xóa class active khỏi tất cả button
            buttons.forEach(btn => btn.classList.remove("active"));

            // Thêm class active vào button được chọn
            this.classList.add("active");

            // Load script tương ứng
            if (this.id === "dda") {
                loadScript("src/dda.js");
            } else if (this.id === "bresenham") {
                loadScript("src/bresenham.js");
            } else if (this.id === "midpoint") {
                loadScript("src/midpoint.js");
            } else if (this.id === "ellipse") {
                loadScript("src/ellipse.js");
            }
        });
    });
});
