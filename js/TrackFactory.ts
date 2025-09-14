import { Vector2, Scene, WebGLRenderer, OrthographicCamera } from 'three';
import { BaseTrack } from './BaseTrack';

/** TrackFactory that should be used to create new track elements and add them to scene  */
export default class TrackFactory {
	constructor(
		scene: Scene,
		renderer: WebGLRenderer,
		camera: OrthographicCamera
	) {
		this.scene = scene;
		this.renderer = renderer;
		this.camera = camera;
	}

	scene: Scene;
	renderer: WebGLRenderer;
	camera: OrthographicCamera;

	createNewTrackFromMouse(
		v00: Vector2,
		v30: Vector2,
		canvas: HTMLCanvasElement
	) {
		const v0 = v00.clone();
		const v3 = v30.clone();
		const dir = v0.clone().sub(v3).normalize();
		const handle = v0.distanceTo(v3) / 3;
		const v1 = v0.clone().addScaledVector(dir, -handle);
		const v2 = v3.clone().addScaledVector(dir, handle);
		this.scene.add(new BaseTrack(this.camera, canvas, v0, v1, v2, v3, 's'));
	}
}
