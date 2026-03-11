import { useEffect, useRef } from "react";
import {
	RendererType,
	SceneController,
} from "../../../lib/three/sceneController";

interface ThreeViewPortProps {
	viewName: string;
	type?: RendererType;
	destroyOnUnmount?: boolean;
	className?: string;
	style?: React.CSSProperties;
}

export default function ThreeViewPort({
	viewName,
	type = "WebGPU",
	destroyOnUnmount = false,
	className,
	style,
}: ThreeViewPortProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		let mounted = true;
		let resizeObserver: ResizeObserver | null = null;
		let controller: SceneController | null = null;

		const setup = async () => {
			controller = await SceneController.createOrGet({
				viewName,
				canvas,
				rendererType: type,
				viewType: "Perspective3D",
				antialias: true,
			});

			if (!mounted) return;

			const resize = () => {
				controller?.resizeFromCanvas();
			};

			resize();

			resizeObserver = new ResizeObserver(() => {
				resize();
			});

			const parent = canvas.parentElement;
			if (parent) {
				resizeObserver.observe(parent);
			}
		};

		setup().catch((error) => {
			console.error(
				`[ThreeViewPort:${viewName}] initialization failed`,
				error,
			);
		});

		return () => {
			mounted = false;
			resizeObserver?.disconnect();

			if (destroyOnUnmount) {
				SceneController.destroyInstance(viewName);
			}
		};
	}, [viewName, type, destroyOnUnmount]);

	return (
		<canvas
			ref={canvasRef}
			className={className}
			style={{
				width: "100%",
				height: "100%",
				display: "block",
				...style,
			}}
		/>
	);
}
