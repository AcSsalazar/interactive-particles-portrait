#version 100
precision highp float;

attribute float pindex;
attribute vec3 position;
attribute vec3 offset;
attribute vec2 uv;
varying vec3 vColor; // ✅ Pasar el color al fragment shader
attribute float angle;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float uTime;
uniform float uRandom;
uniform float uDepth;
uniform float uSize;
uniform vec2 uTextureSize;
uniform sampler2D uTexture;
uniform sampler2D uTouch;

varying vec2 vPUv;
varying vec2 vUv;

#pragma glslify: snoise2 = require(glsl-noise/simplex/2d)

float random(float n) {
    return fract(sin(n) * 43758.5453123);
}

void main() {
    vUv = uv;
    vec2 puv = offset.xy / uTextureSize;
    vPUv = puv;

    vec4 colA = texture2D(uTexture, puv);  // ✅ Toma el color del píxel
    vColor = colA.rgb;  // ✅ Pasamos solo la parte RGB del color al Fragment Shader

    float grey = colA.r * 0.21 + colA.g * 0.71 + colA.b * 0.07;

    vec3 displaced = offset;
    displaced.xy += vec2(random(pindex) - 0.5, random(offset.x + pindex) - 0.5) * uRandom;
    float rndz = (random(pindex) + snoise2(vec2(pindex * 0.1, uTime * 0.1)));
    displaced.z += rndz * (random(pindex) * 2.0 * uDepth);
    displaced.xy -= uTextureSize * 0.5;

    float t = texture2D(uTouch, puv).r;
    displaced.z += t * 20.0 * rndz;
    displaced.x += cos(angle) * t * 20.0 * rndz;
    displaced.y += sin(angle) * t * 20.0 * rndz;

    float psize = (snoise2(vec2(uTime, pindex) * 0.5) + 2.0);
    psize *= max(grey, 0.2);
    psize *= uSize;
     

	 
	// Vibración usando ruido y tiempo
    float speed = 10.0;
    float intensity = 5.0;
    float vibration = (snoise2(vec2(uTime, pindex) * 0.01) + 0.6);
    displaced.x += vibration * 1.0;
    displaced.y += vibration * 1.0;


    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    mvPosition.xyz += position * psize;
    vec4 finalPosition = projectionMatrix * mvPosition;
    gl_Position = finalPosition;





   //float speed = 1.0;    // Controla la rapidez del ruido
   // float intensity = 2.0; // Controla la amplitud del movimiento

    //vec2 noiseInput = vec2(pindex * 0.1, uTime * speed);
    //float noiseX = snoise2(noiseInput) * intensity;
    //float noiseY = snoise2(noiseInput + vec2(1.0, 1.0)) * intensity; 

   // displaced.x += noiseX;
   // displaced.y += noiseY;
}




