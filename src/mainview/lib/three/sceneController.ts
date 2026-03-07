import { OrbitControls } from "three/examples/jsm/Addons.js";
import { ThreeViewportType } from "../../../common/types/threeViewportTypes";
import * as THREE from "three/webgpu";
import * as THREEWebGL from "three";
import { Object3DMapped } from "./mappedObject";

type THREERenderer = THREE.WebGPURenderer | THREEWebGL.WebGLRenderer;

interface SceneControllerOption {
	renderer: THREERenderer;
	scene: THREE.Scene;
	camera: THREE.Camera;
	control: OrbitControls;
	viewName: string;
}

export type RendererType = "WebGPU" | "WebGL";

type ViewType = "Perspective3D" | "Ortho3D" | "2D";

interface RendererInitiateOption {
	renderer: THREERenderer;
	viewName: string;
	scene?: THREE.Scene;
	camera?: THREE.Camera;
	viewType?: ViewType;
	cameraOption?: { fov?: number };
}

const DEFUALT_BG_RGB = [0.9, 0.9, 0.9];
const DEFAULT_FRUSTUM_SIZE = 1e4;

const DEFAULT_FAR_VALUE = 1e7;
const DEFAULT_NEAR_VALUE = -1e7;
const DEFAULT_FOV = 50;

const DEFAULT_POSITION_2D = 100;
const DEFAULT_POSITION_3D = 100;

export class SceneController {
	// Views
	private static instances: Map<string, SceneController> = new Map();
	static getInstance(viewName: string): SceneController | undefined {
		return this.instances.get(viewName);
	}

	static setInstance(viewName: string, sc: SceneController) {}
	private constructor(opt: SceneControllerOption) {
		const { renderer, scene, camera, control, viewName } = opt;

		this._renderer = renderer;
		this._scene = scene;
		this._camera = camera;
		this._controls = control;
		this._viewName = viewName;

		// Animation
		this._timer = new THREE.Timer();
		this._isAnimating = false;
	}

	private static initiateRenderer(opt: RendererInitiateOption) {
		const { renderer, viewName, scene, camera, viewType, cameraOption } =
			opt;

		let injectedViewType = viewType ?? "Perspective3D";

		const canvas = renderer.domElement;

		// Resize
		const width = canvas.width;
		const height = canvas.height;
		renderer.setSize(width, height);

		// Scene creation
		const targetScene = scene ?? new THREE.Scene();
		targetScene.background = new THREE.Color(
			DEFUALT_BG_RGB[0],
			DEFUALT_BG_RGB[1],
			DEFUALT_BG_RGB[2],
		);

		const aspect = width / height;
		const frustumSize = DEFAULT_FRUSTUM_SIZE;

		if (camera) return;

		const targetCamera =
			viewType === "Ortho3D"
				? new THREE.OrthographicCamera(
						(-frustumSize * aspect) / 2,
						(frustumSize * aspect) / 2,
						frustumSize / 2,
						-frustumSize / 2,
						DEFAULT_NEAR_VALUE,
						DEFAULT_FAR_VALUE,
					)
				: viewType === "Perspective3D"
					? new THREE.PerspectiveCamera(
							cameraOption?.fov ?? DEFAULT_FOV,
							aspect,
							DEFAULT_NEAR_VALUE,
							DEFAULT_FAR_VALUE,
						)
					: new THREE.OrthographicCamera(
							(-frustumSize * aspect) / 2,
							(frustumSize * aspect) / 2,
							frustumSize / 2,
							-frustumSize / 2,
							DEFAULT_NEAR_VALUE,
							DEFAULT_FAR_VALUE,
						);

		// Camera settings - common
		targetCamera.up.set(0, 0, 1);

		switch (viewType) {
			case "Perspective3D": {
				targetCamera.lookAt(0, 0, 0);
				targetCamera.position.set(
					DEFAULT_POSITION_3D,
					DEFAULT_POSITION_3D,
					DEFAULT_POSITION_3D,
				);
				targetCamera.zoom = 0.5;
				targetCamera.updateProjectionMatrix();
				break;
			}

			case "Ortho3D": {
				targetCamera.lookAt(0, 0, 0);
				targetCamera.position.set(
					DEFAULT_POSITION_3D,
					DEFAULT_POSITION_3D,
					DEFAULT_POSITION_3D,
				);
				targetCamera.zoom = 0.5;
				targetCamera.updateProjectionMatrix();
				break;
			}

			case "2D": {
				targetCamera.lookAt(0, 0, 0);
				targetCamera.position.set(0, 0, DEFAULT_POSITION_2D);
				targetCamera.zoom = 0.5;
				targetCamera.updateProjectionMatrix();
				break;
			}
		}

		// Default Controls
		const controls = new OrbitControls(targetCamera, renderer.domElement);
		controls.zoomSpeed = 4;
		controls.mouseButtons = {
			MIDDLE: THREE.MOUSE.PAN,
			RIGHT: THREE.MOUSE.ROTATE,
		};

		controls.touches = {
			ONE: null,
			TWO: null,
		};

		targetScene.background = new THREE.Color(
			DEFUALT_BG_RGB[0],
			DEFUALT_BG_RGB[1],
			DEFUALT_BG_RGB[2],
		);

		//Default Light
		const ambientLight = new THREE.AmbientLight("white");
		targetScene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight("white", 1);
		directionalLight.position.set(5, 10, 7.5);
		targetScene.add(directionalLight);

		return {
			renderer: renderer,
			scene: targetScene,
			camera: targetCamera,
			control: controls,
			viewName: viewName,
		};
	}

	public static createInstance(opt: {
		renderer: THREERenderer;
		scene: THREE.Scene;
		camera: THREE.Camera;
		control: OrbitControls;
		viewName: string;
	}): void {
		const sceneController = new SceneController(opt);

		const existing = SceneController.getInstance(opt.viewName);
		// if (existing) {
		// 	sceneController.pasteStatus(
		// 		existing.camera as THREE.OrthographicCamera,
		// 		existing.controls,
		// 	);
		// }

		// sceneController._controls.addEventListener(
		// 	"change",
		// 	sceneController.viewportControl.updateCameraPlane,
		// );

		sceneController.animate();
		sceneController.render();
	}

	public static createRenderer(opt: {
		type: RendererType;
		canvas: HTMLCanvasElement;
		antialias?: boolean;
	}): THREERenderer {
		const { type, canvas, antialias } = opt;

		const renderer =
			type === "WebGL"
				? new THREEWebGL.WebGLRenderer({
						canvas,
						antialias,
					})
				: new THREE.WebGPURenderer({
						canvas,
						antialias,
					});

		renderer.setSize(canvas.width, canvas.height);
		return renderer;
	}

	// Props
	private _scene: THREE.Scene;
	private _camera: THREE.Camera;
	private _renderer: THREERenderer;
	private _viewName: string;
	private _controls: OrbitControls;

	// Animation
	private _isAnimating: boolean;
	private _timer: THREE.Timer;

	// Services

	public resize(width: number, height: number): void {
		this._renderer.setSize(width, height);
		const currentCameraType = this._camera.type;
		if (currentCameraType === "PerspectiveCamera") {
			const perspectiveCamera = this._camera as THREE.PerspectiveCamera;
			perspectiveCamera.aspect = width / height;
			perspectiveCamera.updateProjectionMatrix();
		} else if (currentCameraType == "OrthographicCamera") {
			const orthographicCamera = this._camera as THREE.OrthographicCamera;
			const aspect = width / height;
			const frustumSize = height;

			orthographicCamera.left = (-frustumSize * aspect) / 2;
			orthographicCamera.right = (frustumSize * aspect) / 2;
			orthographicCamera.top = frustumSize / 2;
			orthographicCamera.bottom = -frustumSize / 2;
			orthographicCamera.updateProjectionMatrix();
		} else {
			return;
		}

		this.render();
	}

	addObjects(objects: Object3DMapped[], onRendered?: () => void): void {
		if (!objects || objects.length === 0) return;
		if (onRendered) {
			const once = () => {
				onRendered();
			};

			this._scene.onAfterRender = () => {
				once();
				this._scene.onAfterRender = () => {};
			};
		}

		this._scene.add(...objects);
		this.render();
	}

	removeObjects(ids: string[], onRemoved?: () => void): void {
		const objects = this.traverseOnlyParent(ids);

		if (onRemoved) {
			const once = () => {
				onRemoved();
			};

			this._scene.onAfterRender = () => {
				once();
				this._scene.onAfterRender = () => {};
			};
		}

		this._scene.remove(...objects);
		this.render();
	}

	private traverseOnlyParent(ids: string[] = []): Object3DMapped[] {
		const itemMap: Map<string, Object3DMapped> = new Map();
		const targets: Object3DMapped[] = [];

		this._scene.children.forEach((item) => {
			if (!item.userData["objectId"]) return;

			const mappedItem = item as Object3DMapped;
			itemMap.set(mappedItem.userData.objectId, mappedItem);
			return;
		});

		if (ids.length === 0) targets.push(...itemMap.values());
		else {
			ids.forEach((id) => {
				const target = itemMap.get(id);
				if (target) targets.push(target);
			});
		}

		return targets;
	}

	render(): void {
		this._renderer.render(this._scene, this._camera);
	}

	animate(): void {
		if (this._isAnimating) return;
		this._isAnimating = true;

		const animate = () => {
			const delta = this._timer.getDelta();
			const changed = this._controls.update(delta);
			requestAnimationFrame(animate);

			if (changed) {
				this._controls.update();
				this._renderer.render(this._scene, this._camera);
			}
		};

		animate();
	}

	public replaceRenderer(newRenderer: THREERenderer) {
		// 0) 이전 참조 스냅샷
		const prevControls = this._controls;
		const prevTarget = prevControls.target.clone();
		const prevEnableRotate = prevControls.enableRotate;
		const prevZoomSpeed = prevControls.zoomSpeed;
		const prevMouseButtons = { ...prevControls.mouseButtons };
		const prevTouches = { ...prevControls.touches };

		// 1) selectionService 먼저 정리 (old dom 기준으로 제거되게)
		// this.selectionService?.dispose?.();

		// 2) 기존 controls 정리
		prevControls.dispose();

		// 3) renderer 교체
		this._renderer = newRenderer;

		// 4) 새 domElement에 controls 다시 생성
		const newControls = new OrbitControls(
			this._camera,
			this._renderer.domElement,
		);

		// 5) 설정 복원
		newControls.target.copy(prevTarget);
		newControls.enableRotate = prevEnableRotate;
		newControls.zoomSpeed = prevZoomSpeed;
		newControls.mouseButtons = prevMouseButtons;
		newControls.touches = prevTouches;

		// 6) 교체
		this._controls = newControls;

		// 7) change 리스너
		// this._controls.addEventListener("change", () => {
		// 	this.viewportControl.updateCameraPlane();
		// 	this.render();
		// });

		// 8) Selection Service 재시작 (new dom에 바인딩됨)
		// this._selectionService = new ThreeElementSelectService(this);

		this._controls.update();
		this.render();
	}
}
