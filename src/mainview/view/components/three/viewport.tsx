import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeViewPort() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const canvasWidth = window.innerWidth;
	const canvasHeight = window.innerHeight;

	useEffect(() => {
		if (canvasRef.current) {
			const scene = new THREE.Scene();
			const camera = new THREE.PerspectiveCamera(
				75,
				window.innerWidth / window.innerHeight,
				0.1,
				1000,
			);
			camera.up = new THREE.Vector3(0, 0, 1);
			camera.position.set(10, 10, 10);
			camera.lookAt(new THREE.Vector3());

			scene.background = new THREE.Color(0.9, 0.9, 0.9);

			const geometry = new THREE.BoxGeometry(1, 1, 1);
			const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
			const cube = new THREE.Mesh(geometry, material);
			scene.add(cube);

			camera.position.z = 5;

			const renderer = new THREE.WebGLRenderer({
				canvas: canvasRef.current,
				antialias: true,
			});

			renderer.setSize(window.innerWidth, window.innerHeight);
			renderer.render(scene, camera);
		}
	}, []);

	return <canvas ref={canvasRef} />;
}
