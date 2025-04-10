import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
// @ts-ignore
import vertexShader from "../shaders/vertex.vert?raw";
// @ts-ignore
import noiseFragmentShader from "../shaders/noise.frag?raw";
import { Lag } from "./lag";
import DeltaTime from "../../DeltaTime";
import { ShaderToScreen } from "./shaderToScreen";
import { Assists } from "../loader";

export default function ScreenRenderEngine(
  assists: Assists,
  renderer: THREE.WebGLRenderer,
  sceneRTT: THREE.Scene
) {
  // Update resolution to match edh.dev's high quality screen
  const resolution = 640; // Higher resolution like edh.dev

  const cameraRTT = new THREE.OrthographicCamera(-0.1, 1.496, 0.1, -1.1, 1, 3);
  sceneRTT.add(cameraRTT);
  cameraRTT.position.set(0, 0, 1);

  // Higher quality render target like edh.dev
  const rtTexture = new THREE.WebGLRenderTarget(resolution * 1.33, resolution, {
    format: THREE.RGBFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter
  });

  const composer = new EffectComposer(renderer, rtTexture);
  composer.renderToScreen = false;

  const renderPass = new RenderPass(sceneRTT, cameraRTT);
  composer.addPass(renderPass);

  const noiseMat = new THREE.ShaderMaterial({
    uniforms: {
      uDiffuse: { value: null },
      uTime: { value: 1 },
      uProgress: { value: 1.2 },
    },
    vertexShader: vertexShader,
    fragmentShader: noiseFragmentShader,
  });

  // Enhance bloom settings to match edh.dev
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(128, 128),
    1.2,  // Stronger bloom intensity like edh.dev
    0.35, // Adjusted radius
    0.05  // Slight threshold like edh.dev
  );
  composer.addPass(bloomPass);

  const lag = new Lag(composer.readBuffer, resolution * 1.33, resolution);
  noiseMat.uniforms.uDiffuse.value = lag.outputTexture.texture;

  let uProgress = 1.2;
  const tick = (deltaTime: number, elapsedTime: number) => {
    noiseMat.uniforms.uTime.value = elapsedTime;
    noiseMat.uniforms.uProgress.value = uProgress;

    shaderToScreen.shader.uniforms.uTime.value = elapsedTime;
    shaderToScreen.shader.uniforms.uProgress.value = uProgress;

    shaderToScreen.render(renderer);

    uProgress -= deltaTime * 0.2;
    if (uProgress < 0) uProgress = 1.2;

    lag.render(renderer);
    composer.render();
  };

  const environmentMapTexture = assists.environmentMapTexture;
  environmentMapTexture.encoding = THREE.sRGBEncoding;

  const shaderToScreen = new ShaderToScreen(
    {
      uniforms: {
        uDiffuse: { value: lag.outputTexture.texture },
        uTime: { value: 1 },
        uProgress: { value: 1.2 },
      },
      vertexShader: vertexShader,
      fragmentShader: noiseFragmentShader,
    },
    resolution * 1.33,
    resolution
  );

  shaderToScreen.outputTexture.texture.encoding = THREE.sRGBEncoding;

  // Create material matching edh.dev's screen properties exactly
  const material = new THREE.MeshStandardMaterial();
  material.metalness = 0.1;        // Slight metalness like edh.dev's screen
  material.roughness = 0.1;       // Low roughness for CRT glass effect
  material.envMap = environmentMapTexture;
  material.envMapIntensity = 0.8; // Strong reflections like edh.dev
  material.map = shaderToScreen.outputTexture.texture;
  material.emissive = new THREE.Color(0xffffff); // Add emissive like edh.dev
  material.emissiveMap = shaderToScreen.outputTexture.texture; // Screen emits light
  material.emissiveIntensity = 0.8; // Matches edh.dev's screen glow

  return { tick, material };
}
