import {
	Vector2,
	Raycaster,
	WebGLRenderer,
	OrthographicCamera,
	Scene,
	GridHelper,
	Mesh,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import TrackFactory from './TrackFactory';
import { BaseTrack } from './BaseTrack';
import TrackWalker from './TrackWalker';

const CANVAS_SIZE = 800;
let ws: WebSocket;
// DOM
const mainWindow = document.getElementById('map');
if (!mainWindow) {
	throw new Error('Element with id="map" not found');
}
const camera = new OrthographicCamera(
	CANVAS_SIZE / -2,
	CANVAS_SIZE / 2,
	CANVAS_SIZE / 2,
	CANVAS_SIZE / -2,
	0,
	1000
);

let walker: TrackWalker;
// Pointer & raycaster
const pointer = new Vector2(1000, 1000);
const absolutePointer = new Vector2(-400, -400);
const raycaster: Raycaster = new Raycaster();
// Renderer / Camera
const renderer = new WebGLRenderer();
renderer.setSize(CANVAS_SIZE, CANVAS_SIZE);
renderer.setAnimationLoop(animate);
mainWindow.appendChild(renderer.domElement);

camera.zoom = 20;
camera.updateProjectionMatrix();
// Scene
const scene = new Scene();

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableRotate = false;
controls.listenToKeyEvents(window);

// Events
mainWindow.addEventListener('pointermove', onPointerMove);
mainWindow.addEventListener('click', onItemClick);

let currentItem: BaseTrack;
const tracksToJoin = [];
const trackFactory = new TrackFactory(scene, renderer, camera);
function onItemClick(): void {
	raycaster.setFromCamera(pointer, camera);
	if (createNewTrack && newTrackVectors.length === 1) {
		trackFactory.createNewTrackFromMouse(
			newTrackVectors[0],
			absolutePointer,
			renderer.domElement
		);

		newTrackVectors.length = 0;
		createNewTrack = false;
		return;
	}

	if (createNewTrack && newTrackVectors.length === 0) {
		newTrackVectors.push(absolutePointer.clone());

		return;
	}

	const intersects = raycaster.intersectObjects(scene.children, true);
	console.log(intersects)
	//.filter((e) => e.object.parent instanceof BaseTrack);
	// check if nothing hit and no track selected currently; unselect mode
	if (
		(intersects == undefined || intersects.length == 0) &&
		currentItem != undefined
	)
		return currentItem.setLowestColor();

	// do nothing
	if (intersects == undefined || intersects.length == 0) return;
	// unselect old to select new
	if (currentItem !== undefined) currentItem.setLowestColor();
	let circle;
	if (
		joinTracks &&
		(circle = intersects[0].object) instanceof Mesh &&
		Object.hasOwn(intersects[0].object.userData, 'isOpenEnd')
	) {
		if (circle.userData['isOpenEnd'] && joinCircles.length === 0) {
			joinCircles.push(circle);
			return;
		}
		if (
			circle.userData['isOpenEnd'] &&
			joinCircles[0].uuid !== circle.uuid &&
			circle.parent instanceof BaseTrack
		) {
			circle.parent.joinTwoTracks(scene, joinCircles[0], circle);
			joinCircles.length = 0;
			joinTracks = false;
		}
	}

	if (
		createJunction &&
		(circle = intersects[0].object) instanceof Mesh &&
		Object.hasOwn(intersects[0].object.userData, 'isOpenForDivergingEnd')
	) {
		if (
			circle.userData['isOpenForDivergingEnd'] &&
			joinCircles.length === 0
		) {
			joinCircles.push(circle);
			return;
		}
		if (
			circle.userData['isOpenForDivergingEnd'] &&
			joinCircles[0].uuid !== circle.uuid &&
			circle.parent instanceof BaseTrack
		) {
			circle.parent.joinTwoTracks(scene, joinCircles[0], circle, true);
			joinCircles.length = 0;
			createJunction = false;
			return;
		}
	}

	if (intersects[0].object.parent instanceof BaseTrack) {
		currentItem = intersects[0].object.parent;
		currentItem.MATERIAL.color.setHex(0xd1d1d1);
		return;
	}
}

const gridHelper: GridHelper = new GridHelper(10, 10);
let showGridHelper: boolean = false;
let joinTracks = false;
let createJunction = false;
let createNewTrack = false;
const joinCircles: Mesh[] = [];
const newTrackVectors: Vector2[] = [];

window.addEventListener('keydown', (e) => {
	if (e.ctrlKey) {
		return currentItem.toggleCircle();
	}
	if (e.key.toLowerCase() === 'd') {
		console.log(scene.children);
	}
	if (e.key.toLocaleLowerCase() === 'c') {
		const trackStore: { [id: string]: Object } = {};
		scene.children.forEach((item) => {
			if (item instanceof BaseTrack) {
				trackStore[item.uuid] = item.toJSON();
			}
		});
		console.log(trackStore);
		console.log(JSON.stringify(Object.values(trackStore)));
	}
	if (e.key.toLowerCase() === 'i') {
		currentItem.setLowestColor();
		if (currentItem.outboundTrack != undefined)
			currentItem = currentItem.outboundTrack;
		currentItem.MATERIAL.color.setHex(0xd1d1d1);
	}
	if (e.key.toLowerCase() === 'w') {
		if (walker) walker.moveForward();
		if (currentItem && !walker) walker = new TrackWalker(currentItem);
	}
	if (e.key.toLowerCase() === 'b') {
		if (walker) walker.moveBackward();
		if (currentItem && !walker) walker = new TrackWalker(currentItem);
	}
	if (e.key.toLowerCase() === 'j' && currentItem !== undefined) {
		if (joinTracks) joinCircles.length = 0;
		joinTracks = !joinTracks;
		createJunction = false;
	}
	if (e.key.toLowerCase() === 'g') {
		if (showGridHelper) scene.add(gridHelper);
		else scene.remove(gridHelper);
		showGridHelper = !showGridHelper;
	}
	if (e.key.toLowerCase() === 'e') {
		return currentItem.addNewTrackAtEnd(scene);
	}
	if (e.key.toLowerCase() === 's') {
		return currentItem.addNewTrackAtStart(scene);
	}
	if (e.key.toLocaleLowerCase() === 'y') {
		if (joinTracks) joinCircles.length = 0;
		createJunction = !createJunction;
		joinTracks = false;
	}
	if (e.key.toLowerCase() === 't') {
		createNewTrack = !createNewTrack;
		if (!createNewTrack) newTrackVectors.length = 0;
	}
	if (e.key.toLowerCase() === 'r') {
		scene.remove(currentItem);
		currentItem.deleteTrack();
	}
});

// Animate / Render
function animate(): void {
	controls.update();
	renderer.render(scene, camera);
}

function onPointerMove(event: PointerEvent): void {
	// Normalized device coordinates (-1..+1)
	const rect = (
		renderer.domElement as HTMLCanvasElement
	).getBoundingClientRect();
	const x = event.clientX - rect.left;
	const y = event.clientY - rect.top;
	absolutePointer.x = (pointer.x * camera.right) / camera.zoom;
	absolutePointer.y = (pointer.y * camera.top) / camera.zoom;
	pointer.x = (x / CANVAS_SIZE) * 2 - 1;
	pointer.y = -(y / CANVAS_SIZE) * 2 + 1;
}

function lon2tile(lon: number, zoom: number) {
	return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}
function lat2tile(lat: number, zoom: number) {
	return Math.floor(
		((1 -
			Math.log(
				Math.tan((lat * Math.PI) / 180) +
					1 / Math.cos((lat * Math.PI) / 180)
			) /
				Math.PI) /
			2) *
			Math.pow(2, zoom)
	);
}

const downloadButton = document.getElementById('download');
const form = document.getElementById('jsonForm') as HTMLFormElement | null;
if (downloadButton && downloadButton instanceof HTMLButtonElement) {
	downloadButton.addEventListener('click', (event) => downloadHandler(event));
}
if (form) {
	form.addEventListener('submit', (event) => {
		event.preventDefault();

		const fd = new FormData(event.currentTarget as HTMLFormElement);
		const file = fd.get('jsonFile') as File | null;

		if (!file) {
			console.warn('No file selected');
			return;
		}
		scene.clear();
		const reader = new FileReader();

		reader.onload = () => {
			try {
				const text = reader.result as string;
				const json = JSON.parse(text);
				trackFactory.createTracksFromFile(json);
			} catch (err) {
				console.error('Invalid JSON file:', err);
			}
		};

		reader.onerror = () => {
			console.error('Error reading file:', reader.error);
		};

		reader.readAsText(file);
	});
}

function downloadHandler(event: Event) {
	event.preventDefault();
	console.log('triggered');
	const trackStore: { [id: string]: Object } = {};
	scene.children.forEach((item) => {
		if (item instanceof BaseTrack) {
			trackStore[item.uuid] = item.toJSON();
		}
	});
	const data = JSON.stringify(Object.values(trackStore));
	const url = URL.createObjectURL(
		new Blob([data], { type: 'application/json' })
	);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'network.json'; // filename for download
	a.click();

	// Clean up
	URL.revokeObjectURL(url);
}
