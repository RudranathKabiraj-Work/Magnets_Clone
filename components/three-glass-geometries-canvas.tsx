"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeGlassGeometriesCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 22;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Group for holding floating shapes
    const shapesGroup = new THREE.Group();
    scene.add(shapesGroup);

    // Shape 1: Glass Torus (Ring)
    const torusGeo = new THREE.TorusGeometry(4.5, 1.4, 32, 100);
    const torusMat = new THREE.MeshPhysicalMaterial({
      color: 0x3b82f6,
      transmission: 0.85,
      opacity: 0.8,
      transparent: true,
      roughness: 0.15,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      ior: 1.5,
    });
    const torus = new THREE.Mesh(torusGeo, torusMat);
    torus.position.set(-9, 3, -4);
    shapesGroup.add(torus);

    // Shape 2: Glowing Icosahedron (Crystal)
    const crystalGeo = new THREE.IcosahedronGeometry(3.5, 0);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0x6366f1,
      transmission: 0.9,
      opacity: 0.85,
      transparent: true,
      roughness: 0.1,
      metalness: 0.2,
      clearcoat: 1.0,
      ior: 1.6,
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.set(10, -4, -6);
    shapesGroup.add(crystal);

    // Shape 3: Floating Sphere (Orb)
    const sphereGeo = new THREE.SphereGeometry(2.2, 32, 32);
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: 0x8b5cf6,
      transmission: 0.95,
      opacity: 0.9,
      transparent: true,
      roughness: 0.05,
      clearcoat: 1.0,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.set(-6, -6, 2);
    shapesGroup.add(sphere);

    // Ambient & Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x3b82f6, 3);
    dirLight1.position.set(15, 20, 15);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 2);
    dirLight2.position.set(-15, -10, -10);
    scene.add(dirLight2);

    // Mouse tilt interaction
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      targetX = (event.clientX / window.innerWidth - 0.5) * 0.4;
      targetY = (event.clientY / window.innerHeight - 0.5) * 0.4;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener("resize", handleResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth mouse lerp
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;

      shapesGroup.rotation.y = currentX * 0.5;
      shapesGroup.rotation.x = currentY * 0.5;

      // Independent smooth levitation floating & rotation for each shape
      torus.rotation.x = elapsed * 0.3;
      torus.rotation.y = elapsed * 0.2;
      torus.position.y = 3 + Math.sin(elapsed * 1.2) * 0.8;

      crystal.rotation.x = elapsed * 0.25;
      crystal.rotation.z = elapsed * 0.35;
      crystal.position.y = -4 + Math.cos(elapsed * 1.4) * 0.7;

      sphere.position.y = -6 + Math.sin(elapsed * 1.8) * 0.5;
      sphere.position.x = -6 + Math.cos(elapsed * 1.1) * 0.4;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      torusGeo.dispose();
      torusMat.dispose();
      crystalGeo.dispose();
      crystalMat.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="pointer-events-none absolute inset-0 -z-5 h-full w-full opacity-80 dark:opacity-60"
    />
  );
}
