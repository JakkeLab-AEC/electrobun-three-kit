import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
	RendererType,
	SceneController,
} from "../../../lib/three/sceneController";

interface ThreeViewPortProps {
	type?: RendererType;
	viewName: string;
}

export default function ThreeViewPort(opt: ThreeViewPortProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const canvasWidth = window.innerWidth;
	const canvasHeight = window.innerHeight;

	useEffect(() => {
		if (canvasRef.current) {
			let sceneController: SceneController | undefined =
				SceneController.getInstance(opt.viewName);

			if (!sceneController) {
				const renderer = SceneController.createRenderer({
					type: opt.type ?? "WebGPU",
					canvas: canvasRef.current,
					antialias: true,
				});
			} else {
				const renderer = SceneController.createRenderer({
					type: opt.type ?? "WebGPU",
					canvas: canvasRef.current,
				});
				sceneController.replaceRenderer(renderer);
			}
		}

		// ViewPort Resizer
		const handleResize = () => {
			if (canvasRef.current) {
				const canvasWidth = window.innerWidth;
				const canvasHeight = window.innerHeight;
				canvasRef.current.width = canvasWidth;
				canvasRef.current.height = canvasHeight;
				SceneController.getInstance(opt.viewName)?.resize(
					canvasWidth,
					canvasHeight,
				);
			}
		};

		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	return <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} />;
}
