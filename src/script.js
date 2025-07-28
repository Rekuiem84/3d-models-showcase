import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import { DRACOLoader, GLTFLoader } from "three/examples/jsm/Addons.js";

/**
 * Base
 */
// Debug
const gui = new GUI();

const debugObject = {};

const basePath = "./models";

// Les modèles ont plusieurs proprétés :
// - path : le chemin vers le modèle
// - scale : l'échelle du modèle
// - verticalPosition : la position verticale du modèle (pour ne pas que le modèle soit dans le sol)
// - cameraPosition : la position de la caméra

debugObject.models = {
	Duck: {
		path: "/duck/glTF/Duck.gltf",
		scale: 1,
		verticalPosition: -0.1,
		cameraPosition: {
			x: 2.4,
			y: 2.3,
			z: 2.25,
		},
	},
	Fox: {
		path: "/fox/glTF/Fox.gltf",
		scale: 0.025,
		cameraPosition: {
			x: 2.4,
			y: 1.75,
			z: 2.55,
		},
	},
	"Flight Helmet": {
		path: "/flightHelmet/glTF/FlightHelmet.gltf",
		scale: 3,
		cameraPosition: {
			x: 1.3,
			y: 2.15,
			z: 2.15,
		},
	},
	"Upcycled Computer": {
		path: "/upcycleComputer/scene.gltf",
		scale: 1,
		verticalPosition: 0.06,
		cameraPosition: { x: 1, y: 2, z: 2.55 },
	},
	"Dinosaur Skull": {
		path: "/dinoSkull/scene.gltf",
		scale: 0.15,
		verticalPosition: 1,
		cameraPosition: {
			x: 1.8,
			y: 2.15,
			z: 2.25,
		},
	},
	"Dinosaur Skeleton": {
		path: "/dinoSkeleton/scene.gltf",
		scale: 0.012,
		verticalPosition: -0.25,
		cameraPosition: {
			x: 1.85,
			y: 1.8,
			z: 2.7,
		},
	},
	"Eva 01": {
		path: "/eva01/scene.gltf",
		scale: 0.2,
		verticalPosition: 0.1,
		cameraPosition: {
			x: 1.45,
			y: 2.25,
			z: 4.7,
		},
	},
	"Eva 02": {
		path: "/eva02/scene.gltf",
		scale: 0.12,
		cameraPosition: {
			x: -2.55,
			y: 2.15,
			z: 4.9,
		},
	},
	Leliel: {
		path: "/leliel/scene.gltf",
		scale: 0.5,
		verticalPosition: 0,
		cameraPosition: {
			x: 1.4,
			y: 4.2,
			z: 5.55,
		},
	},
	"Wuhu Island": {
		path: "/wuhuIsland/scene.gltf",
		scale: 0.0001,
		verticalPosition: 0.01,
		cameraPosition: {
			x: 2.2,
			y: 3.15,
			z: 4.5,
		},
	},
};

// Modèle par défaut
debugObject.selectedModel = debugObject.models.Fox;

gui
	.add(debugObject, "selectedModel", debugObject.models)
	.name("Models")
	.onChange(() => {
		// Retirer le modèle actuel de la scène
		const currentModel = scene.getObjectByName("currentModel");
		if (currentModel) {
			scene.remove(currentModel);
		}

		loadModel(debugObject.selectedModel.path);
	});

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Models
 */
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("./draco/");
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

let mixer = null;

function loadModel(modelPath) {
	gltfLoader.load(
		`${basePath}${modelPath}`,
		(gltf) => {
			// Add every element one by one
			// const children = [...gltf.scene.children];
			// for (const child of children) {
			// 	scene.add(child);
			// }

			// Or load the whole scene
			scene.add(gltf.scene);

			// Set the camera position if defined in the debugObject
			if (debugObject.selectedModel.cameraPosition) {
				camera.position.set(
					debugObject.selectedModel.cameraPosition.x || 4,
					debugObject.selectedModel.cameraPosition.y || 5,
					debugObject.selectedModel.cameraPosition.z || 4
				);
			}
			// Set the camera target to the center of the model
			controls.target.set(0, 0.75, 0);

			// Set the model name, useful for removing it later
			gltf.scene.name = "currentModel";
			gltf.scene.scale.setScalar(debugObject.selectedModel.scale);
			gltf.scene.position.set(
				0,
				debugObject.selectedModel.verticalPosition || 0,
				0
			);

			// On traverse tous les enfants (meshes) du modèle pour activer les ombres
			gltf.scene.traverse((child) => {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
				}
			});

			// Si le modèle a une animation, on crée un AnimationMixer
			if (gltf.animations && gltf.animations.length > 0) {
				mixer = new THREE.AnimationMixer(gltf.scene);
				const numberOfAnimations = gltf.animations.length;
				// Jouer la dernière animation
				const action = mixer.clipAction(
					gltf.animations[numberOfAnimations - 1]
				);
				action.play();
			}
		},
		() => {
			// console.log("Model is loading...");
		},
		(error) => {
			console.error("An error occurred while loading the model:", error);
		}
	);
}
loadModel(debugObject.selectedModel.path);

/**
 * Floor
 */
const floor = new THREE.Mesh(
	new THREE.PlaneGeometry(10, 10),
	new THREE.MeshStandardMaterial({
		color: "#444444",
		metalness: 0,
		roughness: 0.5,
	})
);
floor.receiveShadow = true;
floor.rotation.x = -Math.PI * 0.5;
scene.add(floor);

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 2.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.position.set(4, 5, 4);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
};

window.addEventListener("resize", () => {
	// Update sizes
	sizes.width = window.innerWidth;
	sizes.height = window.innerHeight;

	// Update camera
	camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix();

	// Update renderer
	renderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
	75,
	sizes.width / sizes.height,
	0.1,
	100
);
camera.position.set(2, 2, 2);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.75, 0);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
	const elapsedTime = clock.getElapsedTime();
	const deltaTime = elapsedTime - previousTime;
	previousTime = elapsedTime;

	// Update animation
	if (mixer) {
		mixer.update(deltaTime);
	}

	// Update controls
	controls.update();

	// Render
	renderer.render(scene, camera);

	// Call tick again on the next frame
	window.requestAnimationFrame(tick);
};

tick();
