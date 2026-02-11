"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";

// Step definitions: icon SVG paths + labels
const STEPS = [
  {
    label: "Login",
    // User/person icon
    draw: (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => {
      ctx.beginPath();
      ctx.arc(cx, cy - r * 0.22, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy + r * 0.52, r * 0.48, Math.PI, 0);
      ctx.fill();
    },
  },
  {
    label: "Favorite Books",
    // Heart icon
    draw: (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => {
      const s = r * 0.6;
      ctx.beginPath();
      ctx.moveTo(cx, cy + s * 0.7);
      ctx.bezierCurveTo(cx - s * 1.2, cy - s * 0.2, cx - s * 0.6, cy - s * 1.0, cx, cy - s * 0.4);
      ctx.bezierCurveTo(cx + s * 0.6, cy - s * 1.0, cx + s * 1.2, cy - s * 0.2, cx, cy + s * 0.7);
      ctx.fill();
    },
  },
  {
    label: "Browse Events",
    // Calendar/grid icon
    draw: (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => {
      const s = r * 0.55;
      const x = cx - s;
      const y = cy - s * 0.8;
      const w = s * 2;
      const h = s * 1.8;
      const cr = s * 0.2;
      // Rounded rect body
      ctx.beginPath();
      ctx.moveTo(x + cr, y);
      ctx.lineTo(x + w - cr, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + cr);
      ctx.lineTo(x + w, y + h - cr);
      ctx.quadraticCurveTo(x + w, y + h, x + w - cr, y + h);
      ctx.lineTo(x + cr, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - cr);
      ctx.lineTo(x, y + cr);
      ctx.quadraticCurveTo(x, y, x + cr, y);
      ctx.closePath();
      ctx.fill();
      // Grid dots (white)
      ctx.fillStyle = "#ffffff";
      const dotR = s * 0.12;
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 3; col++) {
          const dx = x + s * 0.45 + col * s * 0.55;
          const dy = y + s * 0.7 + row * s * 0.55;
          ctx.beginPath();
          ctx.arc(dx, dy, dotR, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // Top bar accents
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x + s * 0.35, y - s * 0.15, s * 0.15, s * 0.35);
      ctx.fillRect(x + s * 1.5, y - s * 0.15, s * 0.15, s * 0.35);
    },
  },
  {
    label: "Attend Event",
    // Ticket/star icon
    draw: (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => {
      const s = r * 0.55;
      const spikes = 5;
      const outerR = s;
      const innerR = s * 0.45;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerR : innerR;
        const angle = (Math.PI / spikes) * i - Math.PI / 2;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    label: "Memorable Moments",
    // Camera icon
    draw: (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => {
      const s = r * 0.55;
      // Camera body
      const bx = cx - s;
      const by = cy - s * 0.5;
      const bw = s * 2;
      const bh = s * 1.4;
      const cr = s * 0.2;
      ctx.beginPath();
      ctx.moveTo(bx + cr, by);
      ctx.lineTo(bx + bw - cr, by);
      ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + cr);
      ctx.lineTo(bx + bw, by + bh - cr);
      ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - cr, by + bh);
      ctx.lineTo(bx + cr, by + bh);
      ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - cr);
      ctx.lineTo(bx, by + cr);
      ctx.quadraticCurveTo(bx, by, bx + cr, by);
      ctx.closePath();
      ctx.fill();
      // Lens (white circle)
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(cx, cy + s * 0.15, s * 0.4, 0, Math.PI * 2);
      ctx.fill();
      // Inner lens dot
      ctx.fillStyle = "#a1a1aa";
      ctx.beginPath();
      ctx.arc(cx, cy + s * 0.15, s * 0.18, 0, Math.PI * 2);
      ctx.fill();
      // Top bump
      ctx.fillStyle = ctx.fillStyle; // reuse
      const mainColor = "#a1a1aa";
      ctx.fillStyle = mainColor;
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.35, by);
      ctx.lineTo(cx - s * 0.2, by - s * 0.35);
      ctx.lineTo(cx + s * 0.2, by - s * 0.35);
      ctx.lineTo(cx + s * 0.35, by);
      ctx.closePath();
      ctx.fill();
    },
  },
];

const ICON_CANVAS_SIZE = 128;
const LOOP_DURATION = 5; // seconds per full loop
const STEP_COUNT = STEPS.length;

function createIconTexture(
  step: (typeof STEPS)[number],
  isActive: boolean
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = ICON_CANVAS_SIZE;
  canvas.height = ICON_CANVAS_SIZE;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, ICON_CANVAS_SIZE, ICON_CANVAS_SIZE);

  const cx = ICON_CANVAS_SIZE / 2;
  const cy = ICON_CANVAS_SIZE / 2;
  const r = ICON_CANVAS_SIZE * 0.38;

  ctx.fillStyle = isActive ? "#18181b" : "#a1a1aa";
  step.draw(ctx, cx, cy, r);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function StepsBanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Setup renderer
    const width = container.clientWidth;
    const height = container.clientHeight;
    const dpr = Math.min(window.devicePixelRatio, 2);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Orthographic camera (pixel-space)
    const camera = new THREE.OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      0.1,
      100
    );
    camera.position.z = 10;

    const scene = new THREE.Scene();

    // Icon size
    const iconSize = Math.min(height * 0.52, 48);
    // Spacing between step centers
    const spacing = Math.max(iconSize * 2.2, width * 0.22);

    // Pre-generate textures for active/inactive states
    const activeTextures = STEPS.map((s) => createIconTexture(s, true));
    const inactiveTextures = STEPS.map((s) => createIconTexture(s, false));

    // Create meshes
    const meshes: THREE.Mesh[] = [];
    const geometry = new THREE.PlaneGeometry(iconSize, iconSize);

    for (let i = 0; i < STEP_COUNT; i++) {
      const material = new THREE.MeshBasicMaterial({
        map: inactiveTextures[i],
        transparent: true,
        depthTest: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = 0;
      scene.add(mesh);
      meshes.push(mesh);
    }

    // Small label sprites below icons
    const labelSprites: THREE.Sprite[] = [];
    for (let i = 0; i < STEP_COUNT; i++) {
      const labelCanvas = document.createElement("canvas");
      labelCanvas.width = 256;
      labelCanvas.height = 48;
      const lCtx = labelCanvas.getContext("2d")!;
      lCtx.clearRect(0, 0, 256, 48);
      lCtx.font = "600 24px system-ui, -apple-system, sans-serif";
      lCtx.textAlign = "center";
      lCtx.textBaseline = "middle";
      lCtx.fillStyle = "#71717a";
      lCtx.fillText(STEPS[i].label, 128, 24);
      const labelTex = new THREE.CanvasTexture(labelCanvas);
      const spriteMat = new THREE.SpriteMaterial({
        map: labelTex,
        transparent: true,
        depthTest: false,
      });
      const sprite = new THREE.Sprite(spriteMat);
      const labelW = iconSize * 2.2;
      const labelH = labelW * (48 / 256);
      sprite.scale.set(labelW, labelH, 1);
      sprite.position.y = -(iconSize / 2) - labelH * 0.5 - 4;
      scene.add(sprite);
      labelSprites.push(sprite);
    }

    // Connector dots between icons
    const dotGeom = new THREE.CircleGeometry(2, 16);
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0xd4d4d8,
      transparent: true,
      depthTest: false,
    });
    const dots: THREE.Mesh[][] = [];
    for (let i = 0; i < STEP_COUNT; i++) {
      const group: THREE.Mesh[] = [];
      for (let d = 0; d < 3; d++) {
        const dot = new THREE.Mesh(dotGeom, dotMat);
        dot.position.y = 0;
        scene.add(dot);
        group.push(dot);
      }
      dots.push(group);
    }

    // Animation
    let animFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Current "focus" as continuous value
      const progress = (elapsed % LOOP_DURATION) / LOOP_DURATION;
      const focusIndex = progress * STEP_COUNT;
      // Smoothly interpolate the scroll offset
      // Center position shifts by -spacing * focusIndex
      const centerOffset = -spacing * focusIndex;

      for (let i = 0; i < STEP_COUNT; i++) {
        // Base x: step i is at spacing * i from origin
        const baseX = spacing * i + centerOffset;

        // Wrap positions so steps loop seamlessly
        let x = baseX;
        const totalWidth = spacing * STEP_COUNT;
        // Normalize to center
        while (x < -totalWidth / 2) x += totalWidth;
        while (x > totalWidth / 2) x += -totalWidth;

        meshes[i].position.x = x;
        labelSprites[i].position.x = x;

        // Determine distance from center for scaling/opacity
        const dist = Math.abs(x) / spacing;
        const scale = THREE.MathUtils.lerp(1.25, 0.75, Math.min(dist, 1));
        const opacity = THREE.MathUtils.lerp(1.0, 0.35, Math.min(dist, 1.5) / 1.5);

        meshes[i].scale.set(scale, scale, 1);
        const mat = meshes[i].material as THREE.MeshBasicMaterial;
        mat.opacity = opacity;

        // Swap texture to active for current center step
        const isCenter = dist < 0.3;
        mat.map = isCenter ? activeTextures[i] : inactiveTextures[i];
        mat.needsUpdate = true;

        // Label opacity
        const lMat = labelSprites[i].material as THREE.SpriteMaterial;
        lMat.opacity = isCenter ? opacity : opacity * 0.6;

        // Position connector dots to the right of this icon
        const dotGroup = dots[i];
        for (let d = 0; d < dotGroup.length; d++) {
          const dotX = x + iconSize / 2 + 8 + d * 10;
          dotGroup[d].position.x = dotX;
          (dotGroup[d].material as THREE.MeshBasicMaterial).opacity = opacity * 0.5;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.left = -w / 2;
      camera.right = w / 2;
      camera.top = h / 2;
      camera.bottom = -h / 2;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    cleanupRef.current = () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      geometry.dispose();
      dotGeom.dispose();
      dotMat.dispose();
      activeTextures.forEach((t) => t.dispose());
      inactiveTextures.forEach((t) => t.dispose());
      meshes.forEach((m) => (m.material as THREE.MeshBasicMaterial).dispose());
      labelSprites.forEach((s) => (s.material as THREE.SpriteMaterial).dispose());
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };

    return () => {
      cleanupRef.current?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-24 relative"
      aria-hidden="true"
    />
  );
}
