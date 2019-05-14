import React from "react";
import ReactDOM from "react-dom";
import { Canvas } from "react-three-fiber";
import * as THREE from "three";

import "./style.css";

function useListenEffect(node, event, fn) {
  return React.useLayoutEffect(() => {
    node.addEventListener(event, fn);

    return () => {
      node.removeEventListener(event, fn);
    };
  });
}

const loadAsync = async (loader, url) =>
  new Promise(resolve => loader.load(url, resolve));

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewPosition;
  }
`;

const fragmentShader = `
  uniform sampler2D color;
  uniform sampler2D depth;
  uniform float xAngle;
  uniform float yAngle;
  varying vec2 vUv;

  void main() {
    float depth = 1.0 - texture2D(depth, vUv).r;
    vec2 displ = vec2(depth * xAngle, depth * yAngle);
    vec4 color = texture2D(color, vUv + displ / 50.0);
    gl_FragColor = color;
  }
`;

async function start() {
  const loader = new THREE.TextureLoader();
  const colorTexture = await loadAsync(loader, "color.jpg");
  const depthTexture = await loadAsync(loader, "depth.png");

  function App() {
    const [xAngle, setXAngle] = React.useState(0);
    const [yAngle, setYAngle] = React.useState(0);
    useListenEffect(document, "mousemove", e => {
      setXAngle((2.0 * e.clientX) / document.body.clientWidth - 1.0);
      setYAngle((2.0 * e.clientY) / document.body.clientHeight - 1.0);
    });

    const aspect = colorTexture.image.width / colorTexture.image.height;
    const args = {
      uniforms: {
        color: { type: "t", value: colorTexture },
        depth: { type: "t", value: depthTexture },
        xAngle: { type: "f", value: xAngle },
        yAngle: { type: "f", value: yAngle }
      },
      vertexShader,
      fragmentShader
    };

    return (
      <Canvas camera={{ position: [0, 0, 1] }}>
        <mesh scale={[aspect, 1, 1]}>
          <planeGeometry attach="geometry" />
          <shaderMaterial
            attach="material"
            args={[args]}
            uniforms-color-value={colorTexture}
            uniforms-depth-value={depthTexture}
            uniforms-xAngle-value={xAngle}
            uniforms-yAngle-value={yAngle}
          />
        </mesh>
      </Canvas>
    );
  }

  const rootElement = document.getElementById("root");
  ReactDOM.render(<App />, rootElement);
}
start();
