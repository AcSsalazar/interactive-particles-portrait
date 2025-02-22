
import { gsap } from 'gsap'; // ✅ Reemplazo de TweenLite por GSAP 3
import TouchTexture from './TouchTexture';
import * as THREE from 'three';
//import { InstancedBufferGeometry, BufferAttribute } from 'three';

const glslify = require('glslify');

export default class Particles {
    constructor(webgl) {
        this.webgl = webgl;
        this.container = new THREE.Object3D();
    }

    init(src) {
        const loader = new THREE.TextureLoader();
        loader.load(src, (texture) => {
            this.texture = texture;
            this.texture.minFilter = THREE.LinearFilter;
            this.texture.magFilter = THREE.LinearFilter;
            this.texture.format = THREE.RGBFormat;

            this.width = texture.image.width;
            this.height = texture.image.height;

            this.initPoints(true);
            this.initHitArea();
            this.initTouch();
            this.resize();
            this.show();
        });
    }

    initPoints(discard) {
        this.numPoints = this.width * this.height;
        let numVisible = this.numPoints;
        let threshold = 0;
        let originalColors;

        if (discard) {
            numVisible = 0;
            threshold = 34;

            const img = this.texture.image;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = this.width;
            canvas.height = this.height;
            ctx.scale(1, -1);
            ctx.drawImage(img, 0, 0, this.width, this.height * -1);

            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            originalColors = Float32Array.from(imgData.data);

            for (let i = 0; i < this.numPoints; i++) {
                if (originalColors[i * 4 + 0] > threshold) numVisible++;
            }
        }

        const uniforms = {
            uTime: { value: 0 },
            uRandom: { value: 1.0 },
            uDepth: { value: 2.0 },
            uSize: { value: 0.0 },
            uTextureSize: { value: new THREE.Vector2(this.width, this.height) },
            uTexture: { value: this.texture },
            uTouch: { value: null },
        };

        const material = new THREE.RawShaderMaterial({
            uniforms,
            vertexShader: glslify(require('../../../shaders/particle.vert')),
            fragmentShader: glslify(require('../../../shaders/particle.frag')),


            depthTest: false,
            transparent: true,
        });

        const geometry = new THREE.InstancedBufferGeometry();

// Crear un buffer para almacenar los colores de cada partícula
const colors = new Float32Array(numVisible * 3); // RGB por cada partícula

for (let i = 0, j = 0; i < this.numPoints; i++) {
    if (discard && originalColors[i * 4 + 0] <= threshold) continue;

    // Obtener el color del píxel original
    colors[j * 3 + 0] = originalColors[i * 4 + 0] / 255.0; // R
    colors[j * 3 + 1] = originalColors[i * 4 + 1] / 255.0; // G
    colors[j * 3 + 2] = originalColors[i * 4 + 2] / 255.0; // B

    j++;
}

// Agregar el buffer de colores a la geometría
geometry.setAttribute('color', new THREE.InstancedBufferAttribute(colors, 3, false));

        const positions = new THREE.BufferAttribute(new Float32Array(4 * 3), 3);
        positions.setXYZ(0, -0.5,  0.5,  0.0);
        positions.setXYZ(1,  0.5,  0.5,  0.0);
        positions.setXYZ(2, -0.5, -0.5,  0.0);
        positions.setXYZ(3,  0.5, -0.5,  0.0);
        geometry.setAttribute('position', positions);

        const uvs = new THREE.BufferAttribute(new Float32Array(4 * 2), 2);
        uvs.setXYZ(0,  0.0,  0.0);
        uvs.setXYZ(1,  1.0,  0.0);
        uvs.setXYZ(2,  0.0,  1.0);
        uvs.setXYZ(3,  1.0,  1.0);
        geometry.setAttribute('uv', uvs);

        geometry.setIndex(new THREE.BufferAttribute(new Uint16Array([ 0, 2, 1, 2, 3, 1 ]), 1));

        const indices = new Uint16Array(numVisible);
        const offsets = new Float32Array(numVisible * 3);
        const angles = new Float32Array(numVisible);

        for (let i = 0, j = 0; i < this.numPoints; i++) {
            if (discard && originalColors[i * 4 + 0] <= threshold) continue;

            offsets[j * 3 + 0] = i % this.width;
            offsets[j * 3 + 1] = Math.floor(i / this.width);
            indices[j] = i;
            angles[j] = Math.random() * Math.PI;
            j++;
        }

        geometry.setAttribute('pindex', new THREE.InstancedBufferAttribute(indices, 1, false));
        geometry.setAttribute('offset', new THREE.InstancedBufferAttribute(offsets, 3, false));
        geometry.setAttribute('angle', new THREE.InstancedBufferAttribute(angles, 1, false));

        this.object3D = new THREE.Mesh(geometry, material);
        this.container.add(this.object3D);
    }

    initTouch() {
        if (!this.touch) this.touch = new TouchTexture(this);
        this.object3D.material.uniforms.uTouch.value = this.touch.texture;
    }

    initHitArea() {
        const geometry = new THREE.PlaneGeometry(this.width, this.height, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, wireframe: true, depthTest: false });
        material.visible = false;
        this.hitArea = new THREE.Mesh(geometry, material);
        this.container.add(this.hitArea);
    }

    addListeners() {
        this.handlerInteractiveMove = this.onInteractiveMove.bind(this);
        this.webgl.interactive.addListener('interactive-move', this.handlerInteractiveMove);
        this.webgl.interactive.objects.push(this.hitArea);
        this.webgl.interactive.enable();
    }

    removeListeners() {
        this.webgl.interactive.removeListener('interactive-move', this.handlerInteractiveMove);
        const index = this.webgl.interactive.objects.findIndex(obj => obj === this.hitArea);
        this.webgl.interactive.objects.splice(index, 1);
        this.webgl.interactive.disable();
    }

    update(delta) {
        if (!this.object3D) return;
        if (this.touch) this.touch.update();
        this.object3D.material.uniforms.uTime.value += delta;
    }

    show(time = 1.0) {
        gsap.fromTo(this.object3D.material.uniforms.uSize, { value: 0.5 }, { value: 1.5, duration: time });
        gsap.to(this.object3D.material.uniforms.uRandom, { value: 2.0, duration: time });
        gsap.fromTo(this.object3D.material.uniforms.uDepth, { value: 40.0 }, { value: 4.0, duration: time * 1.5 });

        this.addListeners();
    }

	hide(_destroy, time = 0.8) {
		return new Promise((resolve) => {
			if (!this.object3D) {
				console.warn("⚠️ Particles.hide() - this.object3D is undefined");
				resolve();
				return;
			}
	
			gsap.to(this.object3D.material.uniforms.uRandom, { value: 5.0, duration: time, onComplete: () => {
				if (_destroy) this.destroy();
				resolve();
			}});
			gsap.to(this.object3D.material.uniforms.uDepth, { value: -20.0, ease: "power1.in", duration: time });
			gsap.to(this.object3D.material.uniforms.uSize, { value: 0.0, duration: time * 0.8 });
	
			this.removeListeners();
		});
	}
	
    destroy() {
        if (!this.object3D) return;
        this.object3D.parent.remove(this.object3D);
        this.object3D.geometry.dispose();
        this.object3D.material.dispose();
        this.object3D = null;

        if (!this.hitArea) return;
        this.hitArea.parent.remove(this.hitArea);
        this.hitArea.geometry.dispose();
        this.hitArea.material.dispose();
        this.hitArea = null;
    }

    resize() {
        if (!this.object3D) return;
        const scale = this.webgl.fovHeight / this.height;
        this.object3D.scale.set(scale, scale, 1);
        this.hitArea.scale.set(scale, scale, 1);
    }

    onInteractiveMove(e) {
        const uv = e.intersectionData.uv;
        if (this.touch) this.touch.addTouch(uv);
    }
}
