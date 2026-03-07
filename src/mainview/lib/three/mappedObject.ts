import * as THREE from "three";

export class Object3DMapped extends THREE.Object3D {
	userData: Record<string, any> & {
		objectId: string;
	};

	constructor(objectId: string) {
		super();
		this.userData = {
			objectId,
		};
	}
}
