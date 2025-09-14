import {
	CircleGeometry,
	CubicBezierCurve,
	JSONMeta,
	Mesh,
	MeshBasicMaterial,
	Object3D,
	Object3DJSON,
	OrthographicCamera,
	Scene,
	Vector2,
} from 'three';
import { DragControls } from 'three/examples/jsm/controls/DragControls';
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';

export class BaseTrack extends Object3D {
	line: Line2;
	private lineGeometry: LineGeometry = new LineGeometry();
	private bezierCurve: CubicBezierCurve;

	private showsCircles: boolean = false;
	colors = [
		0xff0000, // red
		0x00ff00, // green
		0x0000ff, // blue
		0xffff00, // yellow
		0xff00ff, // magenta
	];
	p0: Vector2;
	p1: Vector2;
	p2: Vector2;
	p3: Vector2;

	camera: OrthographicCamera;
	domElement: HTMLCanvasElement;
	NUMBER_OF_POINTS: number = 100;

	dragControls: DragControls;
	objects: Object3D[] = [];
	MATERIAL: LineMaterial = new LineMaterial({
		color: this.colors[0],
		name: 'concrete',
		linewidth: 2, // world units with size attenuation; pixels otherwise
	});

	inboundTrack?: BaseTrack;
	outboundTrack?: BaseTrack;

	constructor(
		camera: OrthographicCamera,
		domElement: HTMLCanvasElement,
		p0: Vector2,
		p1: Vector2,
		p2: Vector2,
		p3: Vector2,
		name: string
	) {
		super();
		this.p0 = p0;
		this.p1 = p1;
		this.p2 = p2;
		this.p3 = p3;
		this.bezierCurve = new CubicBezierCurve(p0, p1, p2, p3);
		let positions: number[] = [];
		this.camera = camera;
		this.domElement = domElement;
		this.dragControls = new DragControls(this.objects, camera, domElement);
		for (const p of this.bezierCurve.getPoints(this.NUMBER_OF_POINTS))
			positions.push(p.x, p.y, 0);

		this.lineGeometry.setPositions(positions);
		this.line = new Line2(this.lineGeometry, this.MATERIAL);

		this.line.computeLineDistances();
		this.line.scale.set(1, 1, 1);
		this.add(this.line);

		this.dragControls.addEventListener('drag', (e) => {
			let selectedObject: Object3D;
			switch (e.object.uuid) {
				case this.circleMeshP0.uuid:
					selectedObject = this.circleMeshP0;
					this.bezierCurve.v0 = new Vector2(
						selectedObject.position.x,
						selectedObject.position.y
					);
					this.p0 = this.bezierCurve.v0;
					break;
				case this.circleMeshP1.uuid:
					selectedObject = this.circleMeshP1;
					this.bezierCurve.v1 = new Vector2(
						selectedObject.position.x,
						selectedObject.position.y
					);
					this.p1 = this.bezierCurve.v1;
					break;
				case this.circleMeshP2.uuid:
					selectedObject = this.circleMeshP2;
					this.bezierCurve.v2 = new Vector2(
						selectedObject.position.x,
						selectedObject.position.y
					);
					this.p2 = this.bezierCurve.v2;
					break;
				case this.circleMeshP3.uuid:
					selectedObject = this.circleMeshP3;
					this.bezierCurve.v3 = new Vector2(
						selectedObject.position.x,
						selectedObject.position.y
					);
					this.p3 = this.bezierCurve.v3;
					break;
				default:
					return;
			}

			const points = this.bezierCurve.getPoints(this.NUMBER_OF_POINTS);
			const positions = [];
			for (const p of points) positions.push(p.x, p.y, 0);
			this.lineGeometry.setPositions(positions);
			this.line.computeLineDistances();
		});
	}

	circleMeshP0: Mesh = new Mesh();
	circleMeshP1: Mesh = new Mesh();
	circleMeshP2: Mesh = new Mesh();
	circleMeshP3: Mesh = new Mesh();

	addNewTrackAtEnd(scene: Scene, useMouse: boolean = false) {
		if (this.outboundTrack !== undefined) return;
		const last = this;
		const v0 = last.p3.clone();
		const dir = last.p3.clone().sub(last.p2).normalize();
		const len = 10;
		const v3 = v0.clone().addScaledVector(dir, len);
		const handle = len / 3;
		const v1 = v0.clone().addScaledVector(dir, handle);
		const v2 = v3.clone().addScaledVector(dir, -handle);

		const newTrack: BaseTrack = new BaseTrack(
			this.camera,
			this.domElement,
			v0,
			v1,
			v2,
			v3,
			's'
		);
		newTrack.inboundTrack = this;
		this.outboundTrack = newTrack;
		this.setLowestColor();
		scene.add(newTrack);
	}

	addNewTrackAtStart(scene: Scene, useMouse: boolean = false) {
		if (this.inboundTrack !== undefined) return;
		const last = this;
		const v0 = last.p0.clone();
		const dir = last.p0.clone().sub(last.p1).normalize();
		const len = 10;
		const v3 = v0.clone().addScaledVector(dir, len);
		const handle = len / 3;
		const v1 = v0.clone().addScaledVector(dir, handle);
		const v2 = v3.clone().addScaledVector(dir, -handle);
		const newTrack: BaseTrack = new BaseTrack(
			this.camera,
			this.domElement,
			v0,
			v1,
			v2,
			v3,
			's'
		);
		newTrack.inboundTrack = this;
		this.inboundTrack = newTrack;
		this.setLowestColor();
		scene.add(newTrack);
	}

	mirrorAcross(v: Vector2, axis: Vector2): Vector2 {
		const nAxis = axis.clone().normalize(); // unit axis
		const dot = v.clone().dot(nAxis); // projection length
		const proj = nAxis.multiplyScalar(dot); // projection of v onto axis
		return proj.multiplyScalar(2).sub(v).clone(); // reflection formula
	}

	joinTwoTracks(scene: Scene, startNode: Mesh, endNode: Mesh) {
		if (
			!(startNode.parent instanceof BaseTrack) ||
			!(endNode.parent instanceof BaseTrack)
		)
			return;

		const startTrack: BaseTrack = startNode.parent as BaseTrack;
		const endTrack: BaseTrack = endNode.parent as BaseTrack;

		let v0, v1, v2, v3: Vector2;

		if (startNode.name === 'end') {
			v0 = startTrack.bezierCurve.v3.clone();
			v1 = startTrack.bezierCurve.v2.clone().rotateAround(v0, Math.PI);
		} else {
			v0 = startTrack.bezierCurve.v0.clone();
			v1 = startTrack.bezierCurve.v1.clone().rotateAround(v0, Math.PI);
		}

		if (endNode.name === 'end') {
			v3 = endTrack.bezierCurve.v3.clone();
			v2 = endTrack.bezierCurve.v2.clone().rotateAround(v3, Math.PI);
		} else {
			v3 = endTrack.bezierCurve.v0.clone();
			v2 = endTrack.bezierCurve.v1.clone().rotateAround(v3, Math.PI);
		}

		const newTrack: BaseTrack = new BaseTrack(
			this.camera,
			this.domElement,
			v0,
			v1,
			v2,
			v3,
			's'
		);

		if (startNode.name === 'end') {
			startTrack.outboundTrack = newTrack;
			newTrack.inboundTrack = startTrack;
		} else {
			startTrack.inboundTrack = newTrack;
			newTrack.inboundTrack = startTrack;
		}

		if (endNode.name === 'end') {
			endTrack.outboundTrack = newTrack;
			newTrack.outboundTrack = endTrack;
		} else {
			endTrack.inboundTrack = newTrack;
			newTrack.outboundTrack = endTrack;
		}
		startTrack.toggleCircle();
		endTrack.toggleCircle();
		scene.add(newTrack);
	}

	setLowestColor() {
		let firstColor = -1;
		let secondColor = -1;

		if (this.inboundTrack != undefined)
			firstColor = this.inboundTrack.MATERIAL.color.getHex();
		if (this.outboundTrack != undefined)
			secondColor = this.outboundTrack.MATERIAL.color.getHex();
		const allowedColor =
			this.colors.find((c) => c !== firstColor && c !== secondColor) ||
			this.colors[0];
		this.MATERIAL.color.setHex(allowedColor);
	}

	toggleCircle(isShiftPress: boolean = false) {
		if (!this.showsCircles) {
			this.circleMeshP0 = new Mesh(
				new CircleGeometry(0.5, 32),
				new MeshBasicMaterial({ color: 0xff0000 })
			);
			this.circleMeshP0.position.set(this.p0.x, this.p0.y, 0);
			this.circleMeshP0.name = 'start';
			this.circleMeshP0.userData.isOpenEnd =
				this.inboundTrack === undefined;
			this.circleMeshP1 = new Mesh(
				new CircleGeometry(0.3, 32),
				new MeshBasicMaterial({ color: 0x8b0000 })
			);
			this.circleMeshP1.position.set(this.p1.x, this.p1.y, 0);
			this.circleMeshP1.name = 'p1';
			this.circleMeshP2 = new Mesh(
				new CircleGeometry(0.3, 32),
				new MeshBasicMaterial({ color: 0x006400 })
			);
			this.circleMeshP2.position.set(this.p2.x, this.p2.y, 0);
			this.circleMeshP2.name = 'p2';
			this.circleMeshP3 = new Mesh(
				new CircleGeometry(0.5, 32),
				new MeshBasicMaterial({ color: 0x00ff00 })
			);
			this.circleMeshP3.position.set(this.p3.x, this.p3.y, 0);
			this.circleMeshP3.name = 'end';
			this.circleMeshP3.userData.isOpenEnd =
				this.outboundTrack === undefined;
			this.add(
				this.circleMeshP0,
				this.circleMeshP1,
				this.circleMeshP2,
				this.circleMeshP3
			);
			if (this.outboundTrack === undefined) {
				this.dragControls.objects.push(
					this.circleMeshP2,
					this.circleMeshP3
				);
			}
			if (this.inboundTrack === undefined) {
				this.dragControls.objects.push(
					this.circleMeshP0,
					this.circleMeshP1
				);
			}
			this.showsCircles = true;
		} else {
			this.remove(
				this.circleMeshP0,
				this.circleMeshP1,
				this.circleMeshP2,
				this.circleMeshP3
			);
			this.dragControls.objects.splice(
				this.dragControls.objects.indexOf(this.circleMeshP0),
				1
			);
			this.dragControls.objects.splice(
				this.dragControls.objects.indexOf(this.circleMeshP1),
				1
			);
			this.dragControls.objects.splice(
				this.dragControls.objects.indexOf(this.circleMeshP2),
				1
			);
			this.dragControls.objects.splice(
				this.dragControls.objects.indexOf(this.circleMeshP3),
				1
			);
			this.showsCircles = false;
		}
	}

	deleteTrack() {
		if (this.inboundTrack !== undefined) {
			if (this.inboundTrack.inboundTrack?.uuid == this.uuid)
				this.inboundTrack.inboundTrack = undefined;
			if (this.inboundTrack.outboundTrack?.uuid == this.uuid)
				this.inboundTrack.outboundTrack = undefined;
		}

		if (this.outboundTrack !== undefined) {
			if (this.outboundTrack.inboundTrack?.uuid == this.uuid)
				this.outboundTrack.inboundTrack = undefined;
			if (this.outboundTrack.outboundTrack?.uuid == this.uuid)
				this.outboundTrack.outboundTrack = undefined;
		}
		this.dispose();
	}

	dispose() {
		(this.line.geometry as LineGeometry).dispose();
		(this.line.material as LineMaterial).dispose();
	}

	override toJSON(meta?: JSONMeta): any {
		return {
			uuid: this.uuid,
			lerpSteps: this.NUMBER_OF_POINTS,
			type: this.MATERIAL.name,
			bezierCurve: this.bezierCurve.toJSON(),
			inboundTrack: this.inboundTrack?.uuid || '',
			outboundTrack: this.outboundTrack?.uuid || '',
		};
	}
}
