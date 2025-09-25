import { Vector2, Scene, WebGLRenderer, OrthographicCamera } from 'three';
import { BaseTrack } from './BaseTrack';
import { BaseTrackJson } from './DTO/BaseTrackJson';

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

	createTracksFromFile(input: JSON): BaseTrack[] {
		const trackDtos: { [id: string]: BaseTrackJson } = {};
		const newTracks: { [id: string]: BaseTrack } = {};
		(input as unknown as BaseTrackJson[]).forEach((element) => {
			trackDtos[element.uuid] = element;
		});
		Object.values(trackDtos).forEach((element) => {
			const newTrack = this.createTrackFromDto(element);
			newTracks[newTrack.uuid] = newTrack;
		});
		Object.values(trackDtos).forEach((element) => {
			if (element.inboundDiverging !== '')
				newTracks[element.uuid].inboundDiverging =
					newTracks[element.inboundDiverging];
			if (element.inboundTrack !== '')
				newTracks[element.uuid].inboundTrack =
					newTracks[element.inboundTrack];
			if (element.outboundTrack !== '')
				newTracks[element.uuid].outboundTrack =
					newTracks[element.outboundTrack];
			if (element.outboundDiverging !== '')
				newTracks[element.uuid].outboundDiverging =
					newTracks[element.outboundDiverging];
			this.scene.add(newTracks[element.uuid]);
		});
		return Object.values(newTracks);
	}

	private createTrackFromDto(trackDto: BaseTrackJson): BaseTrack {
		const newTrack = new BaseTrack(
			this.camera,
			this.renderer.domElement,
			new Vector2().fromArray([...trackDto.bezierCurve.v0]),
			new Vector2().fromArray([...trackDto.bezierCurve.v1]),
			new Vector2().fromArray([...trackDto.bezierCurve.v2]),
			new Vector2().fromArray([...trackDto.bezierCurve.v3]),
			's'
		);
		newTrack.uuid = trackDto.uuid;
		return newTrack;
	}
}
