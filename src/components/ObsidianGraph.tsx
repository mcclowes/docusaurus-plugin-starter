import { useEffect, useRef, useState, useCallback } from 'react';
import { useHistory } from '@docusaurus/router';
import type { GraphNode, GraphLink, StarterPluginContent } from '../types.js';
import styles from './ObsidianGraph.module.css';

type SimulationNode = GraphNode & {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
};

type SimulationLink = {
  source: SimulationNode | string;
  target: SimulationNode | string;
};

type ObsidianGraphProps = {
  data: StarterPluginContent;
};

export default function ObsidianGraph({ data }: ObsidianGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const history = useHistory();

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<SimulationNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<SimulationNode | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });

  const nodesRef = useRef<SimulationNode[]>([]);
  const linksRef = useRef<SimulationLink[]>([]);
  const simulationRef = useRef<any>(null);
  const isDraggingRef = useRef(false);
  const dragNodeRef = useRef<SimulationNode | null>(null);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);

  const { graphData, options } = data;
  const { nodeStyle, linkStyle, simulation: simOptions } = options;

  // Initialize simulation
  useEffect(() => {
    if (!graphData.nodes.length) return;

    // Deep copy nodes and links for simulation
    nodesRef.current = graphData.nodes.map(n => ({ ...n }));
    linksRef.current = graphData.links.map(l => ({ ...l }));

    // Simple force simulation implementation
    const alpha = { current: 1 };
    const alphaMin = 0.001;
    const alphaDecay = 0.0228;
    const velocityDecay = 0.4;

    // Initialize positions randomly
    const { width, height } = dimensions;
    nodesRef.current.forEach(node => {
      node.x = width / 2 + (Math.random() - 0.5) * width * 0.5;
      node.y = height / 2 + (Math.random() - 0.5) * height * 0.5;
      node.vx = 0;
      node.vy = 0;
    });

    // Create node lookup map
    const nodeById = new Map<string, SimulationNode>();
    nodesRef.current.forEach(node => nodeById.set(node.id, node));

    // Resolve link references
    linksRef.current.forEach(link => {
      if (typeof link.source === 'string') {
        link.source = nodeById.get(link.source) || link.source;
      }
      if (typeof link.target === 'string') {
        link.target = nodeById.get(link.target) || link.target;
      }
    });

    const tick = () => {
      if (alpha.current < alphaMin) return;

      const nodes = nodesRef.current;
      const links = linksRef.current;

      // Apply forces
      // 1. Charge force (repulsion)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeA = nodes[i];
          const nodeB = nodes[j];
          const dx = (nodeB.x || 0) - (nodeA.x || 0);
          const dy = (nodeB.y || 0) - (nodeA.y || 0);
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const strength = (simOptions.chargeStrength * alpha.current) / (dist * dist);

          const fx = (dx / dist) * strength;
          const fy = (dy / dist) * strength;

          nodeA.vx = (nodeA.vx || 0) - fx;
          nodeA.vy = (nodeA.vy || 0) - fy;
          nodeB.vx = (nodeB.vx || 0) + fx;
          nodeB.vy = (nodeB.vy || 0) + fy;
        }
      }

      // 2. Link force (attraction)
      links.forEach(link => {
        const source = link.source as SimulationNode;
        const target = link.target as SimulationNode;
        if (!source.x || !target.x) return;

        const dx = target.x - source.x;
        const dy = (target.y || 0) - (source.y || 0);
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const strength = ((dist - simOptions.linkDistance) / dist) * alpha.current * 0.3;

        const fx = dx * strength;
        const fy = dy * strength;

        source.vx = (source.vx || 0) + fx;
        source.vy = (source.vy || 0) + fy;
        target.vx = (target.vx || 0) - fx;
        target.vy = (target.vy || 0) - fy;
      });

      // 3. Center force
      const cx = width / 2;
      const cy = height / 2;
      nodes.forEach(node => {
        node.vx = (node.vx || 0) + ((cx - (node.x || 0)) * simOptions.centerStrength * alpha.current);
        node.vy = (node.vy || 0) + ((cy - (node.y || 0)) * simOptions.centerStrength * alpha.current);
      });

      // Apply velocity
      nodes.forEach(node => {
        if (node.fx != null) {
          node.x = node.fx;
          node.vx = 0;
        } else {
          node.vx = (node.vx || 0) * velocityDecay;
          node.x = (node.x || 0) + (node.vx || 0);
        }
        if (node.fy != null) {
          node.y = node.fy;
          node.vy = 0;
        } else {
          node.vy = (node.vy || 0) * velocityDecay;
          node.y = (node.y || 0) + (node.vy || 0);
        }
      });

      // Decay alpha
      alpha.current += (alphaMin - alpha.current) * alphaDecay;
    };

    const animate = () => {
      tick();
      draw();
      simulationRef.current = requestAnimationFrame(animate);
    };

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const { width, height } = dimensions;

      // Clear canvas
      ctx.clearRect(0, 0, width * dpr, height * dpr);

      ctx.save();
      ctx.scale(dpr, dpr);

      // Apply transform
      ctx.translate(transform.x + width / 2, transform.y + height / 2);
      ctx.scale(transform.k, transform.k);
      ctx.translate(-width / 2, -height / 2);

      // Draw links
      ctx.strokeStyle = linkStyle.color;
      ctx.lineWidth = linkStyle.width;
      ctx.globalAlpha = linkStyle.opacity;

      linksRef.current.forEach(link => {
        const source = link.source as SimulationNode;
        const target = link.target as SimulationNode;
        if (!source.x || !target.x) return;

        ctx.beginPath();
        ctx.moveTo(source.x, source.y || 0);
        ctx.lineTo(target.x, target.y || 0);
        ctx.stroke();
      });

      ctx.globalAlpha = 1;

      // Draw nodes
      nodesRef.current.forEach(node => {
        if (!node.x) return;

        const isHovered = hoveredNode?.id === node.id;
        const isSelected = selectedNode?.id === node.id;
        const radius = nodeStyle.radius + (node.connections * 0.5);

        // Node glow effect
        if (isHovered || isSelected) {
          const gradient = ctx.createRadialGradient(
            node.x, node.y || 0, radius,
            node.x, node.y || 0, radius * 3
          );
          gradient.addColorStop(0, isSelected ? nodeStyle.activeColor : nodeStyle.hoverColor);
          gradient.addColorStop(1, 'transparent');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(node.x, node.y || 0, radius * 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Node circle
        ctx.fillStyle = isSelected
          ? nodeStyle.activeColor
          : isHovered
            ? nodeStyle.hoverColor
            : nodeStyle.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y || 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // Node label
        if (isHovered || isSelected || transform.k > 0.8) {
          ctx.fillStyle = '#e5e7eb';
          ctx.font = `${12 / transform.k}px system-ui, -apple-system, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(node.label, node.x, (node.y || 0) + radius + 4);
        }
      });

      ctx.restore();
    };

    animate();

    return () => {
      if (simulationRef.current) {
        cancelAnimationFrame(simulationRef.current);
      }
    };
  }, [graphData, dimensions, transform, hoveredNode, selectedNode, nodeStyle, linkStyle, simOptions]);

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Screen to graph coordinates
  const screenToGraph = useCallback((screenX: number, screenY: number) => {
    const { width, height } = dimensions;
    const x = (screenX - transform.x - width / 2) / transform.k + width / 2;
    const y = (screenY - transform.y - height / 2) / transform.k + height / 2;
    return { x, y };
  }, [dimensions, transform]);

  // Find node at position
  const findNodeAt = useCallback((x: number, y: number): SimulationNode | null => {
    for (const node of nodesRef.current) {
      if (!node.x) continue;
      const radius = nodeStyle.radius + (node.connections * 0.5);
      const dx = (node.x) - x;
      const dy = (node.y || 0) - y;
      if (dx * dx + dy * dy < radius * radius * 4) {
        return node;
      }
    }
    return null;
  }, [nodeStyle.radius]);

  // Mouse handlers
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const { x, y } = screenToGraph(screenX, screenY);

    if (isDraggingRef.current && dragNodeRef.current) {
      dragNodeRef.current.fx = x;
      dragNodeRef.current.fy = y;
    } else if (isPanningRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }));
    } else {
      const node = findNodeAt(x, y);
      setHoveredNode(node);
      canvas.style.cursor = node ? 'pointer' : 'grab';
    }

    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  }, [screenToGraph, findNodeAt]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const { x, y } = screenToGraph(screenX, screenY);

    const node = findNodeAt(x, y);
    if (node) {
      isDraggingRef.current = true;
      dragNodeRef.current = node;
      node.fx = node.x;
      node.fy = node.y;
      canvas.style.cursor = 'grabbing';
    } else {
      isPanningRef.current = true;
      canvas.style.cursor = 'grabbing';
    }

    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  }, [screenToGraph, findNodeAt]);

  const handleMouseUp = useCallback(() => {
    if (dragNodeRef.current) {
      dragNodeRef.current.fx = null;
      dragNodeRef.current.fy = null;
    }
    isDraggingRef.current = false;
    dragNodeRef.current = null;
    isPanningRef.current = false;

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = hoveredNode ? 'pointer' : 'grab';
    }
  }, [hoveredNode]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const { x, y } = screenToGraph(screenX, screenY);

    const node = findNodeAt(x, y);
    if (node) {
      setSelectedNode(node);
    }
  }, [screenToGraph, findNodeAt]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const { x, y } = screenToGraph(screenX, screenY);

    const node = findNodeAt(x, y);
    if (node) {
      history.push(node.path);
    }
  }, [screenToGraph, findNodeAt, history]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newK = Math.max(0.1, Math.min(4, transform.k * scaleFactor));

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom towards mouse position
    const { width, height } = dimensions;
    const wx = (mouseX - transform.x - width / 2) / transform.k;
    const wy = (mouseY - transform.y - height / 2) / transform.k;

    setTransform({
      k: newK,
      x: mouseX - width / 2 - wx * newK,
      y: mouseY - height / 2 - wy * newK,
    });
  }, [transform, dimensions]);

  const handleReset = useCallback(() => {
    setTransform({ x: 0, y: 0, k: 1 });
    setSelectedNode(null);
  }, []);

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  return (
    <div ref={containerRef} className={styles.container}>
      <canvas
        ref={canvasRef}
        width={dimensions.width * dpr}
        height={dimensions.height * dpr}
        style={{ width: dimensions.width, height: dimensions.height }}
        className={styles.canvas}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
      />

      {/* Controls */}
      <div className={styles.controls}>
        <button
          className={styles.controlButton}
          onClick={() => setTransform(t => ({ ...t, k: Math.min(4, t.k * 1.2) }))}
          title="Zoom in"
        >
          +
        </button>
        <button
          className={styles.controlButton}
          onClick={() => setTransform(t => ({ ...t, k: Math.max(0.1, t.k / 1.2) }))}
          title="Zoom out"
        >
          -
        </button>
        <button
          className={styles.controlButton}
          onClick={handleReset}
          title="Reset view"
        >
          ↺
        </button>
      </div>

      {/* Info panel */}
      {selectedNode && (
        <div className={styles.infoPanel}>
          <h3 className={styles.infoTitle}>{selectedNode.label}</h3>
          <p className={styles.infoPath}>{selectedNode.path}</p>
          <p className={styles.infoConnections}>
            {selectedNode.connections} connection{selectedNode.connections !== 1 ? 's' : ''}
          </p>
          <button
            className={styles.infoButton}
            onClick={() => history.push(selectedNode.path)}
          >
            Open page
          </button>
        </div>
      )}

      {/* Stats */}
      <div className={styles.stats}>
        {graphData.nodes.length} nodes, {graphData.links.length} links
      </div>
    </div>
  );
}
