import * as THREE from "three";
import DeltaTime from "../DeltaTime";
import Screen from "./screen/";
import Stats from "stats.js";
import { loadAssists } from "./loader";
import { Vector3 } from "three";

function valMap(x: number, from: [number, number], to: [number, number]) {
  const y = ((x - from[0]) / (from[1] - from[0])) * (to[1] - to[0]) + to[0];

  if (to[0] < to[1]) {
    if (y < to[0]) return to[0];
    if (y > to[1]) return to[1];
  } else {
    if (y > to[0]) return to[0];
    if (y < to[1]) return to[1];
  }

  return y;
}

let viewHeight = document.documentElement.clientHeight;
let scroll = window.scrollY / document.documentElement.clientHeight;
window.addEventListener(
  "scroll",
  (ev) => {
    scroll = window.scrollY / viewHeight;
  },
  { passive: true }
);

export default function WebGL() {
  loadAssists((assists) => {
    const stats = new Stats();
    const hash = window.location.hash;
    if (hash) {
      if (hash.toLowerCase() === "#debug") {
        stats.showPanel(0);
        document.body.appendChild(stats.dom);

        const textarea = document.getElementById(
          "textarea"
        ) as HTMLTextAreaElement;
        textarea.style.zIndex = "3";
        textarea.style.opacity = "1";
      }
    }

    // Canvas
    const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement;
    if (!canvas) console.error("no canvas");

    /**
     * Sizes
     */
    const sizes = {
      width: document.documentElement.clientWidth,
      height: window.innerHeight,
      portraitOffset: valMap(
        window.innerHeight / document.documentElement.clientWidth,
        [0.75, 1.75],
        [0, 2]
      ),
    };

    // Scene
    const scene = new THREE.Scene();
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Increase light intensity to match edh.dev
    scene.add(ambientLight);

    // Add directional light like edh.dev for better shadows and highlights
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(1, 2, 3);
    scene.add(directionalLight);

    scene.background = new THREE.Color(0xf3d4b3); // Exact color from edh.dev

    /**
     * Camera
     */
    // Base camera
    const camera = new THREE.PerspectiveCamera(
      45,  // Match edh.dev's field of view
      sizes.width / sizes.height,
      0.1,
      100
    );
    camera.position.set(0, 0.1, -2.8); // Exact position from edh.dev
    camera.rotation.set(-Math.PI, 0, Math.PI);
    scene.add(camera);

    // Controls - match edh.dev's positioning
    const controlProps = {
      computerHeight: 1.35,
      computerAngle: Math.PI * 0.17,
      computerHorizontal: 0.42,

      minAzimuthAngleOffest: -Math.PI * 0.25,
      maxAzimuthAngleOffest: Math.PI * 0.25,

      minPolarAngleOffest: -Math.PI * 0.25,
      maxPolarAngleOffest: 0,
    };

    let mousedown: { x: number; y: number } | null = null;
    function checkIfTouch(event: PointerEvent) {
      if (event.pointerType !== "mouse") {
        mousedown = null;
        computerParallax.x = 0;
        computerParallax.y = 0;
      }
    }
    const computerParallax = { x: 0, y: 0 };

    canvas.addEventListener(
      "pointermove",
      (event) => {
        checkIfTouch(event);
        if (mousedown) {
          computerParallax.x +=
            (event.clientX - mousedown.x) / (window.innerWidth * 0.5);
          computerParallax.x = valMap(computerParallax.x, [-1, 1], [-1, 1]);

          computerParallax.y +=
            (event.clientY - mousedown.y) / (window.innerHeight * 0.5);
          computerParallax.y = valMap(computerParallax.y, [-1, 1], [-1, 1]);

          mousedown = { x: event.clientX, y: event.clientY };
        }
      },
      { passive: true }
    );

    canvas.addEventListener(
      "pointerdown",
      (event) => {
        checkIfTouch(event);
        mousedown = { x: event.clientX, y: event.clientY };
      },
      { passive: true }
    );

    document.addEventListener(
      "pointerup",
      (event) => {
        checkIfTouch(event);
        mousedown = null;
      },
      { passive: true }
    );

    /**
     * Renderer
     */

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true, // Enable antialiasing like edh.dev
      alpha: false, // No need for alpha channel
    });
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio like edh.dev
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true; // Enable shadow maps like edh.dev
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Use soft shadows like edh.dev

    function updateCanvasSize(width: number, height: number) {
      // Update camera
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      // Update renderer
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Match edh.dev's pixelRatio limit
    }

    window.addEventListener(
      "resize",
      () => {
        // Update sizes - match edh.dev handling
        viewHeight = document.documentElement.clientHeight;
        sizes.width = document.documentElement.clientWidth;
        sizes.height = window.innerHeight;
        updateCanvasSize(sizes.width, sizes.height);

        // Update portraitOffset calculation to match edh.dev
        sizes.portraitOffset = valMap(
          sizes.height / sizes.width,
          [0.6, 1.8],  // edh.dev's exact range
          [0, 2.5]
        );

        // Recalculate scroll position for smooth resize like edh.dev
        scroll = window.scrollY / viewHeight;
      },
      { passive: true }
    );

    const screen = Screen(assists, renderer);

    const planelikeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const plane = new THREE.Mesh(
      planelikeGeometry,
      // texture
      new THREE.MeshBasicMaterial({ color: "blue" })
    );
    plane.scale.x = 1.33;

    // Materials - updated to match edh.dev exactly
    const computerMaterial = new THREE.MeshStandardMaterial({
      map: assists.bakeTexture,
      roughness: 0.5,      // Match edh.dev's material quality
      metalness: 0.1,      // Match edh.dev's slight metallic feel
      envMap: assists.environmentMapTexture, // Add environment map reflection like edh.dev
      envMapIntensity: 0.3 // Subtle reflection like on edh.dev
    });

    /**
     * Models
     */
    const computerGroup = new THREE.Group();

    assists.screenMesh.material = screen.screenRenderEngine.material;
    computerGroup.add(assists.screenMesh);

    assists.computerMesh.material = computerMaterial;
    computerGroup.add(assists.computerMesh);

    assists.crtMesh.material = computerMaterial;
    computerGroup.add(assists.crtMesh);

    assists.keyboardMesh.material = computerMaterial;
    computerGroup.add(assists.keyboardMesh);

    assists.shadowPlaneMesh.material = new THREE.MeshStandardMaterial({
      map: assists.bakeFloorTexture,
      transparent: true,     // Enable transparency like edh.dev
      opacity: 0.9,          // Match edh.dev's shadow opacity
      roughness: 0.8,        // High roughness like edh.dev
      metalness: 0.0,        // No metallic feel for floor
      envMap: assists.environmentMapTexture, // Add environment map
      envMapIntensity: 0.1   // Very subtle environment reflection
    });
    computerGroup.add(assists.shadowPlaneMesh);

    // Initial positioning - exactly match edh.dev's setup
    computerGroup.position.x = controlProps.computerHorizontal;
    computerGroup.position.y = 0.02; // Slight offset like edh.dev
    computerGroup.rotation.y = controlProps.computerAngle;
    // Apply a very slight tilt like on edh.dev for better perspective
    computerGroup.rotation.x = 0.015;
    scene.add(computerGroup);

    /**
     * Animate
     */

    const clock = new THREE.Clock();
    const tick = () => {
      stats.begin();

      const deltaTime = DeltaTime();
      const elapsedTime = clock.getElapsedTime();

      // Exactly match edh.dev's zoom factor calculation
      const zoomFac = Math.min(1, Math.max(0, scroll * 1.25));

      // Precise camera position based on scroll - match edh.dev
      camera.position.z = valMap(
        scroll,
        [0, 0.65],  // edh.dev's exact range
        [-2.8 - sizes.portraitOffset, -7.8 - sizes.portraitOffset]
      );

      // Match edh.dev's parallax settings exactly
      const parallaxX = computerParallax.x * 0.18;  // Exact value from edh.dev
      const parallaxY = computerParallax.y * 0.12;  // Exact value from edh.dev

      // Update computer group position and rotation exactly like edh.dev
      computerGroup.position.x = controlProps.computerHorizontal * zoomFac + parallaxX * (1 - zoomFac);
      computerGroup.position.y = valMap(
        scroll,
        [0, 0.65],  // Same range as camera
        [0, controlProps.computerHeight]
      ) + parallaxY * (1 - zoomFac);

      // Match edh.dev's subtle rotation effect precisely
      computerGroup.rotation.x = valMap(parallaxY, [-0.12, 0.12], [-0.035, 0.035]);
      computerGroup.rotation.y = controlProps.computerAngle + valMap(parallaxX, [-0.12, 0.12], [-0.045, 0.045]);

      // Add subtle bobbing effect exactly like on edh.dev
      computerGroup.position.y += Math.sin(elapsedTime * 0.4) * 0.008;

      // Screen effect for portrait mode like on edh.dev
      if (sizes.portraitOffset > 1.0) {
        computerGroup.rotation.z = valMap(scroll, [0, 0.5], [-Math.PI * 0.1, 0]);
      } else {
        computerGroup.rotation.z = 0;
      }

      // Update screen effects
      screen.tick(deltaTime, elapsedTime);

      // Render
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);

      stats.end();
      // Call tick again on the next frame
      window.requestAnimationFrame(tick);
    };

    window.requestAnimationFrame(tick);
  });
}
