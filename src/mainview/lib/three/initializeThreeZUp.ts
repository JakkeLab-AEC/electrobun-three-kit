import * as THREE from "three";

let isThreeZUpInitialized = false;

/**
 * Three.js global default up axis를 Z-up으로 고정한다.
 * 앱 시작 시 한 번만 호출하는 것을 권장한다.
 */
export function initializeThreeZUp() {
	if (isThreeZUpInitialized) return;
	THREE.Object3D.DEFAULT_UP.set(0, 0, 1);
	isThreeZUpInitialized = true;
}
