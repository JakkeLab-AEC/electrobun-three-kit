import * as THREE from "three";
import * as THREEWebGPU from "three/webgpu";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { initializeThreeZUp } from "./initializeThreeZUp";

export type RendererType = "WebGPU" | "WebGL";
export type ViewType = "Perspective3D" | "Ortho3D" | "2D";

export type THREERenderer = THREE.WebGLRenderer | THREEWebGPU.WebGPURenderer;

export type THREECamera = THREE.PerspectiveCamera | THREE.OrthographicCamera;

export type CameraPreset =
	| "Top"
	| "Bottom"
	| "Front"
	| "Back"
	| "Right"
	| "Left"
	| "Iso";

export interface CameraState {
	position: THREE.Vector3;
	target: THREE.Vector3;
	up: THREE.Vector3;
	zoom: number;
}

interface SceneControllerCreateOptions {
	viewName: string;
	canvas: HTMLCanvasElement;
	rendererType?: RendererType;
	viewType?: ViewType;
	scene?: THREE.Scene;
	camera?: THREECamera;
	cameraOption?: {
		fov?: number;
		near?: number;
		far?: number;
		frustumSize?: number;
	};
	controlOption?: {
		enableRotate?: boolean;
		enablePan?: boolean;
		enableZoom?: boolean;
		zoomSpeed?: number;
		screenSpacePanning?: boolean;
	};
	antialias?: boolean;
}

const DEFAULT_BG_RGB: [number, number, number] = [0.9, 0.9, 0.9];
const DEFAULT_FOV = 50;
const DEFAULT_NEAR = 0.1;
const DEFAULT_FAR = 1e7;
const DEFAULT_FRUSTUM_SIZE = 1000;

const DEFAULT_POSITION_3D = 100;
const DEFAULT_POSITION_2D = 100;

const DEFAULT_PRESET_DISTANCE = 1000;

export class SceneController {
	private static instances = new Map<string, SceneController>();

	public static getInstance(viewName: string) {
		return this.instances.get(viewName);
	}

	public static hasInstance(viewName: string) {
		return this.instances.has(viewName);
	}

	public static destroyInstance(viewName: string) {
		const instance = this.instances.get(viewName);
		if (!instance) return;
		instance.dispose();
		this.instances.delete(viewName);
	}

	public static async createOrGet(options: SceneControllerCreateOptions) {
		initializeThreeZUp();

		const existing = this.instances.get(options.viewName);

		if (existing) {
			const newRenderer = this.createRenderer({
				type: options.rendererType ?? "WebGPU",
				canvas: options.canvas,
				antialias: options.antialias ?? true,
			});

			await this.initializeRenderer(newRenderer);
			existing.replaceRenderer(newRenderer);
			existing.resizeFromCanvas();
			return existing;
		}

		const instance = new SceneController(options);
		await instance.initialize();

		this.instances.set(options.viewName, instance);
		return instance;
	}

	public static createRenderer(opt: {
		type: RendererType;
		canvas: HTMLCanvasElement;
		antialias?: boolean;
	}): THREERenderer {
		const { type, canvas, antialias = true } = opt;

		if (type === "WebGL") {
			return new THREE.WebGLRenderer({
				canvas,
				antialias,
				alpha: true,
			});
		}

		return new THREEWebGPU.WebGPURenderer({
			canvas,
			antialias,
			alpha: true,
		});
	}

	private static async initializeRenderer(renderer: THREERenderer) {
		if (renderer instanceof THREEWebGPU.WebGPURenderer) {
			await renderer.init();
		}
	}

	private static createDefaultScene() {
		const scene = new THREE.Scene();
		scene.background = new THREE.Color(...DEFAULT_BG_RGB);

		const ambientLight = new THREE.AmbientLight("white", 1);
		scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight("white", 1);
		directionalLight.position.set(5, 10, 7.5);
		scene.add(directionalLight);

		return scene;
	}

	private static createDefaultCamera(
		viewType: ViewType,
		width: number,
		height: number,
		cameraOption?: SceneControllerCreateOptions["cameraOption"],
	): THREECamera {
		const aspect = width / Math.max(height, 1);
		const near = cameraOption?.near ?? DEFAULT_NEAR;
		const far = cameraOption?.far ?? DEFAULT_FAR;
		const fov = cameraOption?.fov ?? DEFAULT_FOV;
		const frustumSize = cameraOption?.frustumSize ?? DEFAULT_FRUSTUM_SIZE;

		let camera: THREECamera;

		if (viewType === "Perspective3D") {
			camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		} else {
			camera = new THREE.OrthographicCamera(
				(-frustumSize * aspect) / 2,
				(frustumSize * aspect) / 2,
				frustumSize / 2,
				-frustumSize / 2,
				near,
				far,
			);
		}

		camera.up.set(0, 0, 1);

		if (viewType === "2D") {
			camera.position.set(0, 0, DEFAULT_POSITION_2D);
		} else {
			camera.position.set(
				DEFAULT_POSITION_3D,
				DEFAULT_POSITION_3D,
				DEFAULT_POSITION_3D,
			);
		}

		camera.lookAt(0, 0, 0);
		camera.zoom = 1;
		camera.updateProjectionMatrix();

		return camera;
	}

	private static createControls(
		camera: THREECamera,
		domElement: HTMLElement,
		controlOption?: SceneControllerCreateOptions["controlOption"],
	) {
		const controls = new OrbitControls(camera, domElement);

		controls.target.set(0, 0, 0);
		controls.zoomSpeed = controlOption?.zoomSpeed ?? 4;

		controls.enableRotate = controlOption?.enableRotate ?? true;
		controls.enablePan = controlOption?.enablePan ?? true;
		controls.enableZoom = controlOption?.enableZoom ?? true;

		controls.screenSpacePanning = controlOption?.screenSpacePanning ?? true;

		controls.mouseButtons = {
			LEFT: THREE.MOUSE.ROTATE,
			MIDDLE: THREE.MOUSE.PAN,
			RIGHT: THREE.MOUSE.ROTATE,
		};

		controls.update();
		return controls;
	}

	private _viewName: string;
	private _viewType: ViewType;
	private _scene: THREE.Scene;
	private _camera: THREECamera;
	private _renderer: THREERenderer;
	private _controls: OrbitControls;
	private _animationFrameId: number | null = null;
	private _isDisposed = false;
	private _isInitialized = false;
	private _frustumSize: number;

	private constructor(options: SceneControllerCreateOptions) {
		initializeThreeZUp();

		const {
			viewName,
			canvas,
			rendererType = "WebGPU",
			viewType = "Perspective3D",
			scene,
			camera,
			cameraOption,
			controlOption,
			antialias = true,
		} = options;

		this._viewName = viewName;
		this._viewType = viewType;
		this._frustumSize = cameraOption?.frustumSize ?? DEFAULT_FRUSTUM_SIZE;

		this._renderer = SceneController.createRenderer({
			type: rendererType,
			canvas,
			antialias,
		});

		this._scene = scene ?? SceneController.createDefaultScene();

		const size = this.getCanvasDisplaySize(canvas);

		this._camera =
			camera ??
			SceneController.createDefaultCamera(
				viewType,
				size.width,
				size.height,
				cameraOption,
			);

		this._camera.up.set(0, 0, 1);

		this._controls = SceneController.createControls(
			this._camera,
			this._renderer.domElement,
			controlOption,
		);

		if (viewType === "2D") {
			this._controls.enableRotate = false;
		}
	}

	private async initialize() {
		if (this._isInitialized) return;

		await SceneController.initializeRenderer(this._renderer);
		this._isInitialized = true;

		this.resizeFromCanvas();
		this.render();
		this.start();
	}

	get viewName() {
		return this._viewName;
	}

	get viewType() {
		return this._viewType;
	}

	get scene() {
		return this._scene;
	}

	get camera() {
		return this._camera;
	}

	get renderer() {
		return this._renderer;
	}

	get controls() {
		return this._controls;
	}

	private getCanvasDisplaySize(canvas: HTMLCanvasElement) {
		const rect = canvas.getBoundingClientRect();
		const width = Math.max(1, Math.floor(rect.width || canvas.width || 1));
		const height = Math.max(
			1,
			Math.floor(rect.height || canvas.height || 1),
		);
		return { width, height };
	}

	public resizeFromCanvas() {
		const { width, height } = this.getCanvasDisplaySize(
			this._renderer.domElement,
		);
		this.resize(width, height);
	}

	public resize(width: number, height: number) {
		if (!this._isInitialized || this._isDisposed) return;

		const pixelRatio = window.devicePixelRatio || 1;

		this._renderer.setPixelRatio(pixelRatio);
		this._renderer.setSize(width, height, false);

		if (this._camera instanceof THREE.PerspectiveCamera) {
			this._camera.aspect = width / Math.max(height, 1);
			this._camera.updateProjectionMatrix();
		} else if (this._camera instanceof THREE.OrthographicCamera) {
			const aspect = width / Math.max(height, 1);
			const frustumSize = this._frustumSize;

			this._camera.left = (-frustumSize * aspect) / 2;
			this._camera.right = (frustumSize * aspect) / 2;
			this._camera.top = frustumSize / 2;
			this._camera.bottom = -frustumSize / 2;
			this._camera.updateProjectionMatrix();
		}

		this.render();
	}

	public render() {
		if (!this._isInitialized || this._isDisposed) return;
		this._renderer.render(this._scene, this._camera);
	}

	public start() {
		if (!this._isInitialized || this._animationFrameId !== null) return;

		const loop = () => {
			if (this._isDisposed || !this._isInitialized) return;

			this._controls.update();
			this.render();
			this._animationFrameId = window.requestAnimationFrame(loop);
		};

		this._animationFrameId = window.requestAnimationFrame(loop);
	}

	public stop() {
		if (this._animationFrameId === null) return;
		window.cancelAnimationFrame(this._animationFrameId);
		this._animationFrameId = null;
	}

	public addObjects(objects: THREE.Object3D[]) {
		if (!objects.length) return;
		this._scene.add(...objects);
		this.render();
	}

	public removeObjects(objects: THREE.Object3D[]) {
		if (!objects.length) return;
		this._scene.remove(...objects);
		this.render();
	}

	public replaceRenderer(newRenderer: THREERenderer) {
		const prevControls = this._controls;
		const prevTarget = prevControls.target.clone();
		const prevEnableRotate = prevControls.enableRotate;
		const prevEnablePan = prevControls.enablePan;
		const prevEnableZoom = prevControls.enableZoom;
		const prevZoomSpeed = prevControls.zoomSpeed;
		const prevScreenSpacePanning = prevControls.screenSpacePanning;
		const prevMouseButtons = { ...prevControls.mouseButtons };
		const prevTouches = { ...prevControls.touches };

		prevControls.dispose();

		const oldRenderer = this._renderer;
		this._renderer = newRenderer;

		this._controls = new OrbitControls(
			this._camera,
			this._renderer.domElement,
		);

		this._controls.target.copy(prevTarget);
		this._controls.enableRotate = prevEnableRotate;
		this._controls.enablePan = prevEnablePan;
		this._controls.enableZoom = prevEnableZoom;
		this._controls.zoomSpeed = prevZoomSpeed;
		this._controls.screenSpacePanning = prevScreenSpacePanning;
		this._controls.mouseButtons = prevMouseButtons;
		this._controls.touches = prevTouches;
		this._controls.update();

		oldRenderer.dispose?.();

		if (this._isInitialized) {
			this.resizeFromCanvas();
			this.render();
		}
	}

	public dispose() {
		if (this._isDisposed) return;
		this._isDisposed = true;

		this.stop();
		this._controls.dispose();
		this._renderer.dispose?.();
	}

	public getCameraState(): CameraState {
		return {
			position: this._camera.position.clone(),
			target: this._controls.target.clone(),
			up: this._camera.up.clone(),
			zoom: this._camera.zoom,
		};
	}

	public setCameraState(state: Partial<CameraState>) {
		if (state.position) {
			this._camera.position.copy(state.position);
		}

		if (state.up) {
			this._camera.up.copy(state.up);
		} else {
			this._camera.up.set(0, 0, 1);
		}

		if (state.target) {
			this._controls.target.copy(state.target);
		}

		if (typeof state.zoom === "number") {
			this._camera.zoom = state.zoom;
		}

		this._camera.lookAt(this._controls.target);
		this._camera.updateProjectionMatrix();
		this._controls.update();
		this.render();
	}

	public fitTarget(distance = DEFAULT_PRESET_DISTANCE) {
		const direction = new THREE.Vector3()
			.subVectors(this._camera.position, this._controls.target)
			.normalize();

		this._camera.position.copy(
			this._controls.target
				.clone()
				.add(direction.multiplyScalar(distance)),
		);

		this._camera.lookAt(this._controls.target);
		this._camera.updateProjectionMatrix();
		this._controls.update();
		this.render();
	}

	public setCameraPreset(
		preset: CameraPreset,
		options?: {
			target?: THREE.Vector3;
			distance?: number;
			zoom?: number;
		},
	) {
		const target =
			options?.target?.clone() ?? this._controls.target.clone();
		const distance = options?.distance ?? this.getCurrentTargetDistance();
		const zoom = options?.zoom;

		const direction = this.getPresetDirection(preset);
		const nextPosition = target
			.clone()
			.add(direction.multiplyScalar(Math.max(distance, 0.0001)));

		this._camera.up.set(0, 0, 1);
		this._camera.position.copy(nextPosition);
		this._controls.target.copy(target);

		if (typeof zoom === "number") {
			this._camera.zoom = zoom;
		}

		this._camera.lookAt(target);
		this._camera.updateProjectionMatrix();
		this._controls.update();
		this.render();
	}

	public setTopView(options?: {
		target?: THREE.Vector3;
		distance?: number;
		zoom?: number;
	}) {
		this.setCameraPreset("Top", options);
	}

	public setBottomView(options?: {
		target?: THREE.Vector3;
		distance?: number;
		zoom?: number;
	}) {
		this.setCameraPreset("Bottom", options);
	}

	public setFrontView(options?: {
		target?: THREE.Vector3;
		distance?: number;
		zoom?: number;
	}) {
		this.setCameraPreset("Front", options);
	}

	public setBackView(options?: {
		target?: THREE.Vector3;
		distance?: number;
		zoom?: number;
	}) {
		this.setCameraPreset("Back", options);
	}

	public setRightView(options?: {
		target?: THREE.Vector3;
		distance?: number;
		zoom?: number;
	}) {
		this.setCameraPreset("Right", options);
	}

	public setLeftView(options?: {
		target?: THREE.Vector3;
		distance?: number;
		zoom?: number;
	}) {
		this.setCameraPreset("Left", options);
	}

	public setIsoView(options?: {
		target?: THREE.Vector3;
		distance?: number;
		zoom?: number;
	}) {
		this.setCameraPreset("Iso", options);
	}

	private getCurrentTargetDistance() {
		const distance = this._camera.position.distanceTo(
			this._controls.target,
		);
		return distance > 0 ? distance : DEFAULT_PRESET_DISTANCE;
	}

	private getPresetDirection(preset: CameraPreset) {
		switch (preset) {
			case "Top":
				return new THREE.Vector3(0, 0, 1);
			case "Bottom":
				return new THREE.Vector3(0, 0, -1);
			case "Front":
				return new THREE.Vector3(0, -1, 0);
			case "Back":
				return new THREE.Vector3(0, 1, 0);
			case "Right":
				return new THREE.Vector3(1, 0, 0);
			case "Left":
				return new THREE.Vector3(-1, 0, 0);
			case "Iso":
				return new THREE.Vector3(1, -1, 1).normalize();
			default:
				return new THREE.Vector3(1, -1, 1).normalize();
		}
	}
}
