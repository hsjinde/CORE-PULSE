import { useEffect, useRef } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

export const ShaderComponent = () => {
	const containerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!containerRef.current) return;
		const container = containerRef.current;

		let camera: THREE.Camera;
		let scene: THREE.Scene;
		let renderer: THREE.WebGLRenderer;
		let clock: THREE.Clock;
		let uniforms: { [key: string]: THREE.IUniform };

		const init = () => {
			clock = new THREE.Clock();
			camera = new THREE.Camera();
			camera.position.z = 1;

			scene = new THREE.Scene();

			// ✅ Updated geometry
			const geometry = new THREE.PlaneGeometry(2, 2);

			uniforms = {
				u_time: { value: 1.0 },
				u_resolution: { value: new THREE.Vector2() },
			};

			const vertexShader = `
        varying vec2 vUv;
        void main() {
          gl_Position = vec4(position, 1.0);
          vUv = uv;
        }
      `;

			// 磷光示波器:近黑底 + 細格線 + 四條波形軌跡,對應 ChannelLegend 的
			// CH·1(ring 10×)/CH·2(ring 20×)/WRP(coswarp)/REF(carrier)。
			// 色彩紀律:底盤灰階,只有數據通道發色(beacon 綠、amber 琥珀)。
			const fragmentShader = `
        precision highp float;

        uniform vec2 u_resolution;
        uniform float u_time;
        varying vec2 vUv;

        /* 軌跡亮度:銳利核心 + 微弱磷光暈 */
        float trace(vec2 uv, float y, float sharp) {
          float d = abs(uv.y - y);
          return exp(-d * sharp) + exp(-d * 16.) * .16;
        }

        void main() {
          /* 置中座標,y 範圍約 [-.5, .5],x 依長寬比延伸 */
          vec2 uv = (gl_FragCoord.xy - u_resolution * .5) / u_resolution.y;
          float t = u_time;

          vec3 color = vec3(.019);                       /* 近黑底盤 */

          /* 示波器分度格線(灰階,克制) */
          vec2 cell = fract(uv * 10. + .5);
          float grid = step(.982, cell.x) + step(.982, cell.y);
          color += vec3(grid * .03);

          vec3 beacon = vec3(.188, .820, .345);          /* #30d158 */
          vec3 amber  = vec3(.984, .749, .141);          /* amber-400 */

          /* CH·1 — ring 10x,主磷光軌跡 */
          float y1 = .16 * sin(uv.x * 10. + t * .9) * sin(uv.x * 3.1 - t * .35);
          color += beacon * trace(uv, y1, 90.) * .50;

          /* CH·2 — ring 20x,次軌跡 */
          float y2 = -.02 + .09 * sin(uv.x * 20. - t * 1.3) * cos(uv.x * 5. + t * .5);
          color += beacon * trace(uv, y2, 110.) * .26;

          /* WRP — coswarp 干涉(琥珀,壓低) */
          float y3 = -.13 + .06 * cos(uv.x * 3. + t * .25)
                          + .03 * cos(uv.x * 11. + t * .25)
                          + .015 * cos(uv.x * 17. + t * .25);
          color += amber * trace(uv, y3, 120.) * .12;

          /* REF — carrier 基準線(灰,幾乎貼平) */
          float y4 = .24 + .015 * sin(uv.x * 2. - t * .2);
          color += vec3(.6) * trace(uv, y4, 140.) * .10;

          gl_FragColor = vec4(color, 1.0);
        }
      `;

			const material = new THREE.ShaderMaterial({
				uniforms,
				vertexShader,
				fragmentShader,
			});

			const mesh = new THREE.Mesh(geometry, material);
			scene.add(mesh);

			renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
			renderer.setPixelRatio(window.devicePixelRatio);

			container.appendChild(renderer.domElement);

			const onResize = () => {
				const width = container.clientWidth || window.innerWidth;
				const height = container.clientHeight || window.innerHeight;
				renderer.setSize(width, height);
				uniforms.u_resolution.value.x = renderer.domElement.width;
				uniforms.u_resolution.value.y = renderer.domElement.height;
			};

			window.addEventListener("resize", onResize);
			onResize();

			// 使用 ResizeObserver 確保容器大小改變時（如彈性佈局）也能正確重繪
			const resizeObserver = new ResizeObserver(() => {
				onResize();
			});
			resizeObserver.observe(container);

			const animate = () => {
				uniforms.u_time.value = clock.getElapsedTime();
				renderer.render(scene, camera);
				requestAnimationFrame(animate);
			};

			animate();

			return () => {
				window.removeEventListener("resize", onResize);
				resizeObserver.disconnect();
				renderer.dispose();
				containerRef.current?.removeChild(renderer.domElement);
			};
		};

		const cleanup = init();
		return cleanup;
	}, []);

	return (
		<div
			ref={containerRef}
			className={cn("w-full h-full absolute inset-0 overflow-hidden")}
		/>
	);
};
