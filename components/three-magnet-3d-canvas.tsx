"use client";

import { useEffect, useRef } from "react";

export default function ThreeMagnet3DCanvas({ brandColor = "#0066B2" }: { brandColor?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animationFrameId: number;
    let cleanupFunc: (() => void) | null = null;

    // Defer 3D canvas initialization and Three.js library parsing until main thread is completely idle
    const taskId = setTimeout(async () => {
      if (!container) return;

      const THREE = await import("three");

      // Scene, Camera, Renderer
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
      );
      camera.position.z = 24;

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
      });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      container.appendChild(renderer.domElement);

      // Group for 3D Magnet Assembly
      const magnetGroup = new THREE.Group();
      scene.add(magnetGroup);

      // U-Shape Curved Body Geometry
      const shape = new THREE.Shape();
      shape.absarc(0, 0, 5.5, Math.PI, 0, true);
      shape.lineTo(5.5, -3.5);
      shape.lineTo(3.2, -3.5);
      shape.lineTo(3.2, 0);
      shape.absarc(0, 0, 3.2, 0, Math.PI, false);
      shape.lineTo(-3.2, -3.5);
      shape.lineTo(-5.5, -3.5);
      shape.closePath();

      const extrudeSettings = {
        steps: 1,
        depth: 2.2,
        bevelEnabled: true,
        bevelThickness: 0.4,
        bevelSize: 0.4,
        bevelSegments: 6,
      };

      const magnetGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      magnetGeometry.center();

      const themeColor = new THREE.Color(brandColor);

      const bodyMaterial = new THREE.MeshPhysicalMaterial({
        color: themeColor,
        emissive: themeColor,
        emissiveIntensity: 0.25,
        metalness: 0.2,
        roughness: 0.1,
        transmission: 0.75,
        transparent: true,
        opacity: 0.9,
        ior: 1.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        reflectivity: 0.9,
      });

      const magnetMesh = new THREE.Mesh(magnetGeometry, bodyMaterial);
      magnetGroup.add(magnetMesh);

      // Chrome Silver Tips
      const capGeometry = new THREE.BoxGeometry(2.5, 0.9, 2.9);
      const capMaterial = new THREE.MeshStandardMaterial({
        color: 0xf1f5f9,
        metalness: 0.98,
        roughness: 0.05,
      });

      const leftCap = new THREE.Mesh(capGeometry, capMaterial);
      leftCap.position.set(-4.35, -3.4, 0);
      magnetGroup.add(leftCap);

      const rightCap = new THREE.Mesh(capGeometry, capMaterial);
      rightCap.position.set(4.35, -3.4, 0);
      magnetGroup.add(rightCap);

      magnetGroup.position.set(-8, 1, -2);
      magnetGroup.rotation.x = 0.3;
      magnetGroup.rotation.y = -0.3;

      // Sparkles
      const sparkCount = 30;
      const sparkGeo = new THREE.BufferGeometry();
      const sparkPos = new Float32Array(sparkCount * 3);

      for (let i = 0; i < sparkCount * 3; i += 3) {
        sparkPos[i] = (Math.random() - 0.5) * 16 - 8;
        sparkPos[i + 1] = (Math.random() - 0.5) * 16;
        sparkPos[i + 2] = (Math.random() - 0.5) * 10 - 2;
      }

      sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
      const sparkMat = new THREE.PointsMaterial({
        color: 0x60a5fa,
        size: 0.25,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      });
      const sparkles = new THREE.Points(sparkGeo, sparkMat);
      scene.add(sparkles);

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0x60a5fa, 3);
      dirLight.position.set(15, 20, 20);
      scene.add(dirLight);

      // Mouse tilt
      let targetX = 0;
      let targetY = 0;
      let currentX = 0;
      let currentY = 0;

      const handleMouseMove = (event: MouseEvent) => {
        targetX = (event.clientX / window.innerWidth - 0.5) * 0.4;
        targetY = (event.clientY / window.innerHeight - 0.5) * 0.4;
      };

      window.addEventListener("mousemove", handleMouseMove);

      const handleResize = () => {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      };

      window.addEventListener("resize", handleResize);

      // Animation Loop (Throttled to 30 FPS)
      let clock = new THREE.Clock();
      let lastRenderTime = 0;
      const targetFpsInterval = 1000 / 30;

      const animate = (currentTime: number) => {
        animationFrameId = requestAnimationFrame(animate);

        const elapsedDelta = currentTime - lastRenderTime;
        if (elapsedDelta < targetFpsInterval) return;
        lastRenderTime = currentTime - (elapsedDelta % targetFpsInterval);

        const elapsed = clock.getElapsedTime();

        currentX += (targetX - currentX) * 0.05;
        currentY += (targetY - currentY) * 0.05;

        magnetGroup.rotation.y = -0.4 + currentX;
        magnetGroup.rotation.x = 0.4 + currentY;
        magnetGroup.position.y = 1;

        sparkles.rotation.y = currentX * 0.2;

        renderer.render(scene, camera);
      };

      animate(performance.now());

      cleanupFunc = () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("resize", handleResize);
        if (container && renderer.domElement) {
          container.removeChild(renderer.domElement);
        }
        magnetGeometry.dispose();
        bodyMaterial.dispose();
        capGeometry.dispose();
        capMaterial.dispose();
        sparkGeo.dispose();
        sparkMat.dispose();
        renderer.dispose();
      };
    }, 600);

    return () => {
      clearTimeout(taskId);
      if (cleanupFunc) cleanupFunc();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="pointer-events-none absolute inset-0 -z-5 h-full w-full opacity-85 dark:opacity-75"
    />
  );
}
