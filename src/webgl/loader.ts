import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Font, FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

type Assists = {
  screenMesh: THREE.Mesh;
  computerMesh: THREE.Mesh;
  crtMesh: THREE.Mesh;
  keyboardMesh: THREE.Mesh;
  shadowPlaneMesh: THREE.Mesh;
  bakeTexture: THREE.Texture;
  bakeFloorTexture: THREE.Texture;
  publicPixelFont: Font;
  chillFont: Font;
  environmentMapTexture: THREE.CubeTexture;
};

function loadAssists(callback: (assists: Assists) => any) {
  const assists: any = {};
  let loadingErrors = 0;

  const loadingDOM = document.querySelector("#loading");
  const loadingItemsDOM = document.querySelector("#loading-items");
  const loadingBarDOM = document.querySelector("#loading-bar-progress");

  const manager = new THREE.LoadingManager();

  manager.onStart = function (url, itemsLoaded, itemsTotal) {
    console.log(
      "Started loading file: " +
        url +
        ".\nLoaded " +
        itemsLoaded +
        " of " +
        itemsTotal +
        " files."
    );
  };

  manager.onLoad = function () {
    if (!loadingItemsDOM) return;
    loadingItemsDOM.textContent = `Nearly There...`;

    console.log("Loading complete!");
    window.setTimeout(() => {
      (loadingDOM as any).style.opacity = "0";
      callback(assists as Assists);
    }, 200);
    window.setTimeout(() => {
      (loadingDOM as any).style.display = "none";
    }, 500);
  };

  manager.onProgress = function (url, itemsLoaded, itemsTotal) {
    if (!loadingItemsDOM || !loadingBarDOM) return;
    (loadingBarDOM as HTMLElement).style.transform = `scaleX(${
      itemsLoaded / itemsTotal
    })`;
    loadingItemsDOM.textContent = `${itemsLoaded} of ${itemsTotal} File Loaded: ${url}`;
    console.log(
      "Loading file: " +
        url +
        ".\nLoaded " +
        itemsLoaded +
        " of " +
        itemsTotal +
        " files."
    );
  };

  manager.onError = function(url) {
    console.error('Error loading asset:', url);
    loadingErrors++;
    if (loadingItemsDOM) {
      loadingItemsDOM.textContent = `Error loading: ${url}`;
    }
  };

  // Fonts
  const fontLoader = new FontLoader(manager);
  fontLoader.load("./fonts/public-pixel.json", (font) => {
    assists.publicPixelFont = font;
  },
  undefined,
  (error) => {
    console.error('Error loading public-pixel font:', error);
    // Fallback to create a basic font
    assists.publicPixelFont = new Font({});
  });

  fontLoader.load("./fonts/chill.json", (font) => {
    assists.chillFont = font;
  },
  undefined,
  (error) => {
    console.error('Error loading chill font:', error);
    // Fallback to create a basic font
    assists.chillFont = new Font({});
  });

  // Texture loader
  const textureLoader = new THREE.TextureLoader(manager);
  textureLoader.load("./textures/bake-quality-5.jpg", (tex) => {
    tex.flipY = false;
    tex.encoding = THREE.sRGBEncoding;
    assists.bakeTexture = tex;
  },
  undefined,
  (error) => {
    console.error('Error loading bake texture:', error);
    // Fallback texture
    assists.bakeTexture = new THREE.Texture();
  });

  textureLoader.load("./textures/bake_floor-quality-3.jpg", (tex) => {
    tex.flipY = false;
    tex.encoding = THREE.sRGBEncoding;
    assists.bakeFloorTexture = tex;
  },
  undefined,
  (error) => {
    console.error('Error loading floor texture:', error);
    // Fallback texture
    assists.bakeFloorTexture = new THREE.Texture();
  });

  const cubeTextureLoader = new THREE.CubeTextureLoader(manager);

  cubeTextureLoader.load(
    [
      "./textures/environmentMap/px.jpg",
      "./textures/environmentMap/nx.jpg",
      "./textures/environmentMap/py.jpg",
      "./textures/environmentMap/ny.jpg",
      "./textures/environmentMap/pz.jpg",
      "./textures/environmentMap/nz.jpg",
    ],
    (tex) => {
      assists.environmentMapTexture = tex;
    },
    undefined,
    (error) => {
      console.error('Error loading environment map:', error);
      // Create a default environment map
      assists.environmentMapTexture = new THREE.CubeTexture();
    }
  );

  // Mesh
  const gltfLoader = new GLTFLoader(manager);
  gltfLoader.load("./models/Commodore710_33.5.glb", (gltf) => {
    assists.screenMesh = gltf.scene.children.find((m) => m.name === "Screen");
    assists.computerMesh = gltf.scene.children.find(
      (m) => m.name === "Computer"
    );
    assists.crtMesh = gltf.scene.children.find((m) => m.name === "CRT");
    assists.keyboardMesh = gltf.scene.children.find(
      (m) => m.name === "Keyboard"
    );
    assists.shadowPlaneMesh = gltf.scene.children.find(
      (m) => m.name === "ShadowPlane"
    );
  },
  (progress) => {
    // Progress callback
    console.log(`Model loading: ${Math.round(progress.loaded / progress.total * 100)}%`);
  },
  (error) => {
    console.error('Error loading 3D model:', error);
    // Create fallback meshes
    assists.screenMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
    assists.computerMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
    assists.crtMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
    assists.keyboardMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
    assists.shadowPlaneMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1));
  });
}

export { loadAssists };
export type { Assists };
