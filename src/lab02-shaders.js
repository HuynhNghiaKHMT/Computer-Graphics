// src/lab02-shaders.js

// Gói các chuỗi shader vào một đối tượng global duy nhất
// Điều này giúp tránh lỗi "has already been declared" nếu file này bị tải lại.
window.lab02ShaderSources = {
    VERTEX_SHADER_SOURCE: `#version 300 es
in vec2 a_position;
uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_rotation;
uniform vec2 u_scale;
uniform float u_moveSpeed;
uniform float u_rotateSpeed;
uniform float u_time;

void main() {
    // Scale vị trí trước
    vec2 scaledPosition = a_position * u_scale; 

    // Rotate the position (manual rotation)
    vec2 rotatedPosition = vec2(
        scaledPosition.x * u_rotation.y + scaledPosition.y * u_rotation.x,
        scaledPosition.y * u_rotation.y - scaledPosition.x * u_rotation.x
    );

    // Cập nhật góc xoay dựa trên thời gian (auto rotation)
    float autoAngle = u_rotateSpeed * u_time;
    vec2 dynamicRotation = vec2(sin(autoAngle), cos(autoAngle));

    vec2 animatedRotation = vec2(
        rotatedPosition.x * dynamicRotation.y + rotatedPosition.y * dynamicRotation.x,
        rotatedPosition.y * dynamicRotation.y - rotatedPosition.x * dynamicRotation.x
    );

    // Cập nhật vị trí di chuyển dựa trên tốc độ (auto translation)
    float moveX = u_moveSpeed * cos(u_time * 2.0) * 50.0; // u_time * 2.0 để có tốc độ khác
    float moveY = u_moveSpeed * sin(u_time * 2.0) * 50.0;
    vec2 animatedTranslation = u_translation + vec2(moveX, moveY);

    // Kết hợp tất cả các phép biến đổi
    vec2 position = animatedRotation + animatedTranslation;

    // Chuyển đổi vị trí từ pixel sang không gian clip (-1 đến +1)
    vec2 zeroToOne = position / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;

    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}
`, // <--- Dấu backtick đóng ngay sau dấu xuống dòng cuối cùng

    FRAGMENT_SHADER_SOURCE: `#version 300 es
precision mediump float;
uniform vec4 u_color;
out vec4 outColor; // <-- KHAI BÁO BIẾN ĐẦU RA

void main() {
    outColor = u_color; // <-- GÁN CHO BIẾN ĐẦU RA
}
` // <--- Dấu backtick đóng ngay sau dấu xuống dòng cuối cùng
};