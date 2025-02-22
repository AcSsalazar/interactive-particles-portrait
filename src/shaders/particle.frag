// @author brunoimbrizi / http://brunoimbrizi.com

precision highp float;
#define GLSLIFY 1

uniform sampler2D uTexture;

varying vec2 vPUv;
varying vec2 vUv;
varying vec3 vColor; // ✅ Se mueve aquí, en el ámbito global

void main() {
    vec4 color = vec4(vColor, 1.0); // ✅ Ahora usamos el color del Vertex Shader

    vec2 uv = vUv;
    vec2 puv = vPUv;

    // pixel color
    vec4 colA = texture2D(uTexture, puv);

    // greyscale
    float grey = colA.r * 0.21 + colA.g * 0.71 + colA.b * 0.07;
    vec4 colB = vec4(grey, grey, grey, 1.0);

    // círculo de partículas
    float border = 0.3;
    float radius = 0.5;
    float dist = radius - distance(uv, vec2(0.5));
    float t = smoothstep(0.0, border, dist);

    // mezcla del color de la imagen con el efecto de círculo
    color.a = t;
    
    gl_FragColor = color;
}
