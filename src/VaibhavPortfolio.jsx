// ============================================================
// VAIBHAV KARBHANTNAL — COSMIC BACKEND PORTFOLIO
// Stack: React + Three.js / R3F + Tailwind CSS + Lucide React
// ============================================================

// ─── ASSET CONFIG (update these paths before deploying) ─────
const USER_IMAGE_URL = "/assets/vaibhav-avatar.jpg"; // Replace with real headshot
const RESUME_URL = "/assets/ResumeVaibhav3.pdf";       // Replace with real resume
const GITHUB_URL = "https://github.com/NukGod-V";
const LINKEDIN_URL = "https://www.linkedin.com/in/vaibhav-karbhantnal-8b4388257/";
const EMAIL = "vaibhavk2one@gmail.com";
const DOMAIN = "vaibhavkarbhantnal.me";
// ────────────────────────────────────────────────────────────

import { useRef, useState, useEffect, useMemo, Suspense } from "react";
import { Analytics } from "@vercel/analytics/react"
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Stars,
  Html,
  MeshDistortMaterial,
  Float,
  Trail,
  Sparkles,
  PerspectiveCamera,
  useProgress,
} from "@react-three/drei";
import * as THREE from "three";
import {
  Mail,
  ExternalLink,
  Terminal,
  Cpu,
  Zap,
  Globe,
  ChevronDown,
  ArrowUpRight,
  MapPin,
  Circle,
  MessageSquare,
  X,
} from "lucide-react";
import ChatWidget from "./ChatWidget";
// Custom drop-in replacements for brand icons removed by Lucide
const Github = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Linkedin = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);
// ─────────────────────────────────────────────────
// GLOBAL STYLES injected into <head>
// ─────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Bebas+Neue&family=Syne:wght@400;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --black:    #050505;
    --slate:    #0f0f0f;
    --card:     #111113;
    --border:   #1e1e22;
    --blue:     #00e5ff;
    --orange:   #ff6d00;
    --grey:     #3a3a3a;
    --text:     #c8c8d0;
    --faint:    #3d3d42;
  }

  html { scroll-behavior: smooth; }

  body {
    background: var(--black);
    color: var(--text);
    font-family: 'Syne', sans-serif;
    overflow-x: hidden;
    cursor: none;
  }

  /* CUSTOM CURSOR (desktop / fine-pointer devices only) */
  .cursor-dot {
    position: fixed; top: 0; left: 0;
    width: 8px; height: 8px;
    background: var(--blue);
    border-radius: 50%;
    pointer-events: none;
    z-index: 9999;
    transform: translate(-50%, -50%);
    transition: transform 0.08s ease;
    mix-blend-mode: screen;
  }
  .cursor-ring {
    position: fixed; top: 0; left: 0;
    width: 36px; height: 36px;
    border: 1px solid rgba(0,229,255,0.4);
    border-radius: 50%;
    pointer-events: none;
    z-index: 9998;
    transform: translate(-50%, -50%);
    transition: transform 0.18s ease, width 0.2s, height 0.2s, border-color 0.2s;
  }
  .cursor-ring.hovering {
    width: 56px; height: 56px;
    border-color: var(--orange);
  }

  /* On touch devices there is no hover/mouse — restore the native cursor
     and hide the custom dot/ring so nothing gets stuck on screen. */
  @media (hover: none), (pointer: coarse) {
    body { cursor: auto; }
    .cursor-dot, .cursor-ring { display: none; }
  }

  /* SCANLINE OVERLAY */
  .scanlines {
    position: fixed; inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0,0,0,0.08) 2px,
      rgba(0,0,0,0.08) 4px
    );
    pointer-events: none;
    z-index: 100;
    mix-blend-mode: multiply;
  }

  /* NOISE GRAIN */
  .grain {
    position: fixed; inset: -200%;
    width: 400%; height: 400%;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 99;
    opacity: 0.25;
    animation: grain-shift 0.5s steps(1) infinite;
  }
  @keyframes grain-shift {
    0%   { transform: translate(0, 0); }
    20%  { transform: translate(-2%, -3%); }
    40%  { transform: translate(3%, 2%); }
    60%  { transform: translate(-1%, 4%); }
    80%  { transform: translate(2%, -1%); }
    100% { transform: translate(0, 0); }
  }

  /* SECTION BASE */
  section { position: relative; }

  /* MONO font */
  .mono { font-family: 'Share Tech Mono', monospace; }
  .bebas { font-family: 'Bebas Neue', sans-serif; }

  /* CARD HOVER GLOW */
  .project-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 2px;
    transition: border-color 0.3s, box-shadow 0.3s, transform 0.3s;
  }
  .project-card:hover {
    border-color: var(--blue);
    box-shadow: 0 0 40px rgba(0,229,255,0.06), inset 0 0 60px rgba(0,229,255,0.02);
    transform: translateY(-4px);
  }
  .project-card.orange:hover {
    border-color: var(--orange);
    box-shadow: 0 0 40px rgba(255,109,0,0.08), inset 0 0 60px rgba(255,109,0,0.02);
  }

  /* TIMELINE LINE */
  .timeline-line {
    position: absolute;
    left: 50%;
    top: 0; bottom: 0;
    width: 1px;
    background: linear-gradient(to bottom, transparent, var(--blue) 20%, var(--orange) 80%, transparent);
    transform: translateX(-50%);
  }

  /* GLITCH EFFECT */
  @keyframes glitch {
    0%   { clip-path: inset(0 0 95% 0); transform: translate(-2px, 0); }
    10%  { clip-path: inset(40% 0 50% 0); transform: translate(2px, 0); }
    20%  { clip-path: inset(70% 0 20% 0); transform: translate(-1px, 0); }
    30%  { clip-path: inset(10% 0 80% 0); transform: translate(1px, 0); }
    40%  { clip-path: inset(60% 0 30% 0); transform: translate(-2px, 0); }
    100% { clip-path: inset(0 0 0 0); transform: translate(0, 0); }
  }
  .glitch-text {
    position: relative;
    display: inline-block;
  }
  .glitch-text::before,
  .glitch-text::after {
    content: attr(data-text);
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
  }
  .glitch-text::before {
    color: var(--blue);
    animation: glitch 3s infinite steps(1);
    opacity: 0.4;
  }
  .glitch-text::after {
    color: var(--orange);
    animation: glitch 3s infinite steps(1) reverse;
    opacity: 0.3;
  }

  /* PULSE RING */
  @keyframes pulse-ring {
    0%   { transform: scale(1); opacity: 0.6; }
    100% { transform: scale(2.5); opacity: 0; }
  }
  .pulse-ring {
    animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
  }

  /* SCROLL FADE IN */
  .fade-up {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.8s ease, transform 0.8s ease;
  }
  .fade-up.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* TAG CHIP */
  .tag {
    display: inline-block;
    padding: 2px 10px;
    border: 1px solid var(--faint);
    color: #6e6e78;
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.05em;
    border-radius: 2px;
  }
  .tag.blue { border-color: rgba(0,229,255,0.3); color: var(--blue); }
  .tag.orange { border-color: rgba(255,109,0,0.3); color: var(--orange); }

  /* FOOTER TERMINAL */
  .terminal-line {
    overflow: hidden;
    white-space: nowrap;
    border-right: 2px solid var(--blue);
    animation: typing 3s steps(40, end) forwards, blink 0.75s step-end infinite;
  }
  @keyframes typing {
    from { width: 0 }
    to   { width: 100% }
  }
  @keyframes blink {
    from, to { border-color: transparent }
    50%      { border-color: var(--blue) }
  }

  /* SCROLLBAR */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--black); }
  ::-webkit-scrollbar-thumb { background: var(--grey); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--blue); }

  /* ═══════════════ RESPONSIVE / MOBILE ═══════════════ */

  /* Grids that are hard-coded to two columns via inline styles need
     !important here to win over the inline style on small screens. */
  @media (max-width: 860px) {
    .skills-matrix-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
    .skills-matrix-grid > div:nth-child(2) { padding-top: 0 !important; }

    .footer-grid { grid-template-columns: 1fr !important; gap: 48px !important; }

    .timeline-row {
      grid-template-columns: 28px 1fr !important;
      gap: 20px !important;
      margin-bottom: 40px !important;
    }
    .timeline-row .timeline-spacer { display: none !important; }
    .timeline-row .timeline-content { text-align: left !important; }
    .timeline-row .timeline-node-col { align-items: flex-start !important; }
    .timeline-row .timeline-node-col > div { margin-top: 4px !important; }
  }

  @media (max-width: 768px) {
    .timeline-line { left: 14px; }
    .hero-canvas { height: 55vh !important; }

    nav.site-nav { padding: 14px 5vw !important; }
    nav.site-nav .nav-links { gap: 18px !important; }
    nav.site-nav .nav-links a { font-size: 9px !important; letter-spacing: 0.14em !important; }

    #hero { padding-bottom: 60px; }
    #hero .hero-copy { padding: 0 5vw !important; }
    #hero .hero-cta { flex-direction: column !important; align-items: stretch !important; }
    #hero .hero-cta a { justify-content: center !important; }

    #projects, #journey { padding: 80px 5vw !important; }
    .project-card { padding: 32px 24px 28px !important; }

    footer#contact { padding: 56px 5vw 32px !important; }
    footer .footer-bottom-bar { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
  }

  @media (max-width: 480px) {
    .status-badge span { font-size: 9.5px !important; letter-spacing: 0.1em !important; }
  }
`;

// ─────────────────────────────────────────────────
// 3D COMPONENTS
// ─────────────────────────────────────────────────

/** Small hook: true when viewport is at/under a mobile breakpoint.
 *  Used to cut down particle counts for smoother mobile GPU performance. */
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

/** Central spinning "Data Kernel" — wireframe icosahedron + distort sphere */
function DataKernel({ mouse }) {
  const groupRef = useRef();
  const icoRef = useRef();
  const innerRef = useRef();
  const ringRef = useRef();
  const isMobile = useIsMobile();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Smooth mouse tracking
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        mouse.current[0] * 0.4,
        0.04
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        -mouse.current[1] * 0.25,
        0.04
      );
    }

    // Continuous spin
    if (icoRef.current) {
      icoRef.current.rotation.y = t * 0.12;
      icoRef.current.rotation.z = t * 0.07;
    }
    if (innerRef.current) {
      innerRef.current.rotation.x = -t * 0.2;
      innerRef.current.rotation.z = t * 0.15;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.05;
    }
  });

  const icoGeo = useMemo(() => new THREE.IcosahedronGeometry(1.4, 1), []);
  const ringGeo = useMemo(() => new THREE.TorusGeometry(2.2, 0.008, 2, 120), []);
  const ring2Geo = useMemo(() => new THREE.TorusGeometry(2.6, 0.005, 2, 80), []);

  return (
    <group ref={groupRef}>
      {/* Outer wireframe icosahedron */}
      <mesh ref={icoRef} geometry={icoGeo}>
        <meshBasicMaterial color="#00e5ff" wireframe opacity={0.25} transparent />
      </mesh>

      {/* Inner glowing sphere */}
      <mesh ref={innerRef}>
        <sphereGeometry args={[0.82, 64, 64]} />
        <MeshDistortMaterial
          color="#001a2e"
          emissive="#00e5ff"
          emissiveIntensity={0.35}
          distort={0.4}
          speed={2.5}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Orbital rings */}
      <mesh ref={ringRef} geometry={ringGeo} rotation={[Math.PI / 2.5, 0.3, 0]}>
        <meshBasicMaterial color="#00e5ff" opacity={0.5} transparent />
      </mesh>
      <mesh geometry={ring2Geo} rotation={[Math.PI / 1.6, 0.6, 0.4]}>
        <meshBasicMaterial color="#ff6d00" opacity={0.25} transparent />
      </mesh>

      {/* Sparkles cloud — fewer on mobile to keep frame rate smooth */}
      <Sparkles
        count={isMobile ? 30 : 80}
        scale={5}
        size={1.2}
        speed={0.3}
        color="#00e5ff"
        opacity={0.6}
      />

      {/* Outer glow halo */}
      <mesh>
        <sphereGeometry args={[1.6, 32, 32]} />
        <meshBasicMaterial
          color="#00e5ff"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

/** Floating orbital data node (small orbiting sphere) */
function OrbitalNode({ radius, speed, color, size, offset }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + offset;
    ref.current.position.x = Math.cos(t) * radius;
    ref.current.position.z = Math.sin(t) * radius;
    ref.current.position.y = Math.sin(t * 0.7) * 0.5;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[size, 8, 8]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

/** Background star field with depth */
function BackgroundField() {
  const isMobile = useIsMobile();
  return (
    <>
      <Stars
        radius={90}
        depth={50}
        count={isMobile ? 1200 : 3000}
        factor={3}
        saturation={0}
        fade
        speed={0.3}
      />
    </>
  );
}

/** Grid floor plane */
function GridFloor() {
  const ref = useRef();
  useFrame(() => {
    if (ref.current) {
      ref.current.position.y = -3.5;
    }
  });
  return (
    <gridHelper
      ref={ref}
      args={[30, 30, "#0d2b38", "#0a1a22"]}
      rotation={[0, 0, 0]}
    />
  );
}

/** Loader overlay */
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="mono" style={{ color: "#00e5ff", fontSize: 13, textAlign: "center" }}>
        <div style={{ marginBottom: 8 }}>INITIALIZING SYSTEMS</div>
        <div style={{
          width: 200, height: 2,
          background: "#111",
          borderRadius: 2,
          overflow: "hidden"
        }}>
          <div style={{
            width: `${progress}%`,
            height: "100%",
            background: "linear-gradient(90deg, #00e5ff, #ff6d00)",
            transition: "width 0.3s"
          }} />
        </div>
        <div style={{ marginTop: 8, color: "#3a3a3a" }}>{progress.toFixed(0)}%</div>
      </div>
    </Html>
  );
}

// ─────────────────────────────────────────────────
// PROJECTS DATA
// ─────────────────────────────────────────────────
const PROJECTS = [
  {
    id: "01",
    title: "Forest Fire Risk\nPrediction System",
    tagline: "Near real-time remote sensing AI backend utilizing NASA FIRMS thermal anomalies and 99% accurate XGBoost fire-risk classification mapping.",
    tech: ["FastAPI", "XGBoost", "Streamlit", "NASA FIRMS", "Python", "Joblib"],
    accent: "blue",
    stat: "99% ACC",
    statLabel: "XGBoost Model",
    icon: "🌲",
    link:"https://github.com/NukGod-V/Forest-Fire-Monitor",
    liveLink:"https://forest-fire.vaibhavkarbhantnal.me/",
    desc: "Geospatial AI pipeline ingesting live thermal satellite data → risk heatmap in milliseconds.",
  },
  {
    id: "02",
    title: "Centralized Enterprise\nMailer System",
    tagline: "Production Flask core engine with async task scheduling, RBAC token gating, attachment sanitation, and pixel-level delivery tracking.",
    tech: ["Flask", "MySQL", "REST API", "RBAC", "SMTP", "Jinja2"],
    accent: "orange",
    stat: "3 Tables",
    statLabel: "Normalized Schema",
    icon: "📡",
    link:"https://github.com/NukGod-V/Mailer-System",
    liveLink: "https://mailer-system.vaibhavkarbhantnal.me",
    desc: "End-to-end email orchestration: schedule → validate → dispatch → track transparently.",
  },
  {
    id: "03",
    title: "Crawlyzer\nAgentic Engine",
    tagline: "High-throughput dual-agent AI orchestration architecture for semantic web ingestion, deep research scaling, and structured intelligence extraction.",
    tech: ["Python", "LLM Agents", "Crawling", "NLP", "FastAPI", "Vector DB"],
    accent: "blue",
    stat: "2 Agents",
    statLabel: "Dual-Core Arch",
    icon: "🕷",
    link:"https://github.com/NukGod-V/crawlyzer",
    desc: "Orchestrated crawler + analyst agent loop — transforms raw web data into structured insight.",
  },
];

const TIMELINE = [
  {
    date: "May 2025",
    label: "ENTERPRISE INTERNSHIP",
    title: "Systems & Web Development Intern",
    detail: "Engineered a production-grade Internal Mailer System. Architected a centralized Flask platform with role-based access, background job scheduling, and real-time delivery tracking.",
    accent: "blue",
    side: "left",
  },
  {
    date: "Aug 2025",
    label: "AI MODEL DEPLOYMENT",
    title: "Forest Fire Risk Mapping System",
    detail: "Designed a full-stack decision-support pipeline utilizing NASA FIRMS data and an XGBoost classification model achieving 99% test accuracy. Served via a high-performance FastAPI backend.",
    accent: "orange",
    side: "right",
  },
  {
    date: "Feb 2026",
    label: "ACADEMIC MILESTONE",
    title: "MCA — BMS Institute of Technology",
    detail: "Master of Computer Applications. Specialized in Data Science, Machine Learning, and production-grade systems engineering.",
    accent: "blue",
    side: "left",
  },
  {
    date: "Current Track",
    label: "ACTIVE ARCHITECTURE MATRIX",
    title: "Distributed Systems & Cloud Operations",
    detail: "Executing a rigorous system-scaling roadmap. Currently deploying asynchronous task queues (Celery/Redis), containerized microservices (Docker), CI/CD pipelines, and enterprise observability tools (Datadog, Sentry).",
    accent: "orange",
    side: "right",
  }
];

const SKILLS = [
  { name: "Python / FastAPI", pct: 92 },
  { name: "Flask / REST APIs", pct: 90 },
  { name: "XGBoost / ML Ops", pct: 85 },
  { name: "MySQL / Schema Design", pct: 82 },
  { name: "Streamlit / Dashboards", pct: 80 },
  { name: "System Architecture", pct: 88 },
];

// ─────────────────────────────────────────────────
// CUSTOM CURSOR
// ─────────────────────────────────────────────────
function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    // Touch / coarse-pointer devices don't have a mouse cursor at all —
    // skip all of the listener setup so nothing is left stuck on screen.
    const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (isTouch) return;

    const moveCursor = (e) => {
      if (dotRef.current) {
        dotRef.current.style.left = e.clientX + "px";
        dotRef.current.style.top = e.clientY + "px";
      }
      if (ringRef.current) {
        setTimeout(() => {
          ringRef.current.style.left = e.clientX + "px";
          ringRef.current.style.top = e.clientY + "px";
        }, 60);
      }
    };
    const onEnter = () => setHovering(true);
    const onLeave = () => setHovering(false);

    document.addEventListener("mousemove", moveCursor);
    document.querySelectorAll("a, button, .hoverable")
      .forEach(el => {
        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);
      });

    return () => document.removeEventListener("mousemove", moveCursor);
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className={`cursor-ring ${hovering ? "hovering" : ""}`} />
    </>
  );
}

// ─────────────────────────────────────────────────
// SCROLL OBSERVER HOOK
// ─────────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".fade-up");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// ─────────────────────────────────────────────────
// SECTION COMPONENTS
// ─────────────────────────────────────────────────

/** HERO */
function HeroSection({ mouse }) {
  return (
    <section
      id="hero"
      style={{
        position: "relative",
        height: "100vh",
        minHeight: 560,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* 3D Canvas */}
      <div className="hero-canvas" style={{ position: "absolute", inset: 0 }}>
        <Canvas
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent" }}
        >
          <PerspectiveCamera makeDefault position={[0, 0, 7]} fov={50} />
          <ambientLight intensity={0.3} />
          <pointLight position={[5, 5, 5]} color="#00e5ff" intensity={2} />
          <pointLight position={[-5, -3, -5]} color="#ff6d00" intensity={1} />

          <Suspense fallback={<Loader />}>
            <BackgroundField />
            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.4}>
              <DataKernel mouse={mouse} />
            </Float>
            <OrbitalNode radius={3.5} speed={0.4} color="#00e5ff" size={0.07} offset={0} />
            <OrbitalNode radius={3.5} speed={0.4} color="#00e5ff" size={0.05} offset={2.1} />
            <OrbitalNode radius={3.5} speed={0.4} color="#ff6d00" size={0.06} offset={4.2} />
            <OrbitalNode radius={4.2} speed={0.25} color="#ff6d00" size={0.08} offset={1} />
            <OrbitalNode radius={4.2} speed={0.25} color="#00e5ff" size={0.04} offset={3} />
            <GridFloor />
          </Suspense>
        </Canvas>
      </div>

      {/* Vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at center, transparent 30%, #050505 100%)",
        pointerEvents: "none",
      }} />

      {/* Overlay text */}
      <div className="hero-copy" style={{
        position: "relative",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        height: "100%",
        padding: "0 6vw",
        pointerEvents: "none",
      }}>
        {/* Status badge */}
        <div className="status-badge" style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 28,
          flexWrap: "wrap",
        }}>
          <div style={{ position: "relative", width: 10, height: 10, flexShrink: 0 }}>
            <div style={{
              position: "absolute", inset: 0,
              borderRadius: "50%",
              background: "#00e5ff",
            }} />
            <div className="pulse-ring" style={{
              position: "absolute", inset: 0,
              borderRadius: "50%",
              background: "rgba(0,229,255,0.4)",
            }} />
          </div>
          <span className="mono" style={{ color: "#00e5ff", fontSize: 11, letterSpacing: "0.15em" }}>
            LOCATION: BENGALURU, IN // AVAILABLE FOR PRODUCTION SYSTEMS
          </span>
        </div>

        {/* Main title */}
        <h1
          className="glitch-text bebas"
          data-text="VAIBHAV"
          style={{
            fontSize: "clamp(52px, 10vw, 130px)",
            lineHeight: 0.9,
            color: "#e8e8f0",
            letterSpacing: "-0.02em",
            marginBottom: 4,
          }}
        >
          VAIBHAV
        </h1>
        <h1
          className="bebas"
          style={{
            fontSize: "clamp(52px, 10vw, 130px)",
            lineHeight: 0.9,
            color: "#00e5ff",
            letterSpacing: "-0.02em",
            marginBottom: 24,
          }}
        >
          KARBHANTNAL
        </h1>

        {/* Subtitle */}
        <p className="mono" style={{
          fontSize: "clamp(11px, 1.4vw, 15px)",
          color: "#6e6e78",
          letterSpacing: "0.25em",
          marginBottom: 32,
          maxWidth: 480,
        }}>
          SYSTEMS BACKEND & MACHINE LEARNING ENGINEER
        </p>

        {/* CTA row */}
        <div className="hero-cta" style={{ display: "flex", gap: 16, pointerEvents: "all", flexWrap: "wrap" }}>
          <a
            href="#projects"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px 28px",
              background: "#00e5ff",
              color: "#050505",
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 12,
              letterSpacing: "0.12em",
              textDecoration: "none",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#33eeff"}
            onMouseLeave={e => e.currentTarget.style.background = "#00e5ff"}
          >
            VIEW SYSTEMS <ArrowUpRight size={14} />
          </a>
          <a
            href={`mailto:${EMAIL}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px 28px",
              background: "transparent",
              color: "#00e5ff",
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 12,
              letterSpacing: "0.12em",
              textDecoration: "none",
              border: "1px solid rgba(0,229,255,0.3)",
              cursor: "pointer",
              transition: "border-color 0.2s, background 0.2s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(0,229,255,0.06)";
              e.currentTarget.style.borderColor = "#00e5ff";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "rgba(0,229,255,0.3)";
            }}
          >
            OPEN CHANNEL <Mail size={14} />
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{
        position: "absolute",
        bottom: 32,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        zIndex: 10,
      }}>
        <span className="mono" style={{ color: "#3a3a3a", fontSize: 9, letterSpacing: "0.2em" }}>
          SCROLL
        </span>
        <ChevronDown size={14} color="#3a3a3a" style={{ animation: "grain-shift 2s ease-in-out infinite" }} />
      </div>
    </section>
  );
}

/** PROJECTS SECTION */
function ProjectsSection() {
  return (
    <section id="projects" style={{ padding: "120px 6vw", background: "#050505" }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 80 }}>
        <div className="mono" style={{ color: "#ff6d00", fontSize: 11, letterSpacing: "0.3em", marginBottom: 16 }}>
          // 02 — CORE SYSTEMS
        </div>
        <h2 className="bebas" style={{
          fontSize: "clamp(36px, 6vw, 72px)",
          color: "#e8e8f0",
          letterSpacing: "-0.01em",
          lineHeight: 1,
        }}>
          ENGINEERED<br />
          <span style={{ color: "#00e5ff" }}>SYSTEMS</span>
        </h2>
      </div>

      {/* Cards grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 2,
      }}>
        {PROJECTS.map((p, i) => (
          <div
            key={p.id}
            className={`project-card ${p.accent} fade-up`}
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "40px 36px 36px",
              transitionDelay: `${i * 0.1}s`,
              height: "100%",
            }}
          >
            {/* Card top row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="mono" style={{
                  color: p.accent === "blue" ? "#00e5ff" : "#ff6d00",
                  fontSize: 11,
                  letterSpacing: "0.15em",
                  opacity: 0.6,
                }}>
                  PROJ_{p.id}
                </span>
              </div>
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
              }}>
                <span className="bebas" style={{
                  color: p.accent === "blue" ? "#00e5ff" : "#ff6d00",
                  fontSize: 22,
                  lineHeight: 1,
                }}>
                  {p.stat}
                </span>
                <span className="mono" style={{ color: "#3a3a3a", fontSize: 9 }}>{p.statLabel}</span>
              </div>
            </div>

            {/* Icon */}
            <div style={{ fontSize: 32, marginBottom: 16 }}>{p.icon}</div>

            {/* Title */}
            <h3 className="bebas" style={{
              fontSize: "clamp(22px, 2.5vw, 30px)",
              color: "#e8e8f0",
              lineHeight: 1.1,
              marginBottom: 16,
              whiteSpace: "pre-line",
            }}>
              {p.title}
            </h3>

            {/* Desc */}
            <p style={{
              fontSize: 12,
              lineHeight: 1.7,
              color: "#5a5a64",
              marginBottom: 12,
              fontFamily: "'Share Tech Mono', monospace",
            }}>
              {p.desc}
            </p>

            {/* Tagline */}
            <p style={{
              fontSize: 13,
              lineHeight: 1.7,
              color: "#8e8e98",
              marginBottom: 28,
            }}>
              {p.tagline}
            </p>

            {/* Tags */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 28 }}>
              {p.tech.map(t => (
                <span key={t} className={`tag ${p.accent}`}>{t}</span>
              ))}
            </div>

            {/* Divider */}
            <div style={{
              height: 1,
              background: `linear-gradient(90deg, ${p.accent === "blue" ? "rgba(0,229,255,0.2)" : "rgba(255,109,0,0.2)"}, transparent)`,
              marginBottom: 24,
              marginTop: "auto",
            }} />

            {/* Links Section (Now supports multiple links) */}
            <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>

              {/* Repo Link */}
              {p.link && (
                <a href={p.link} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
                  <Terminal size={12} color={p.accent === "blue" ? "#00e5ff" : "#ff6d00"} />
                  <span className="mono" style={{
                    color: p.accent === "blue" ? "#00e5ff" : "#ff6d00",
                    fontSize: 11,
                    letterSpacing: "0.1em",
                  }}>
                    SOURCE CODE
                  </span>
                </a>
              )}

              {/* Live Deployment Link */}
              {p.liveLink && (
                <a href={p.liveLink} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
                  <ExternalLink size={12} color={p.accent === "blue" ? "#00e5ff" : "#ff6d00"} />
                  <span className="mono" style={{
                    color: p.accent === "blue" ? "#00e5ff" : "#ff6d00",
                    fontSize: 11,
                    letterSpacing: "0.1em",
                  }}>
                    LIVE SYSTEM
                  </span>
                </a>
              )}

            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** SKILLS MATRIX */
function SkillsMatrix() {
  return (
    <section style={{
      padding: "80px 6vw",
      background: "#0a0a0a",
      borderTop: "1px solid #111",
      borderBottom: "1px solid #111",
    }}>
      <div className="skills-matrix-grid" style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 60,
        maxWidth: 900,
      }}>
        <div>
          <div className="fade-up">
            <div className="mono" style={{ color: "#ff6d00", fontSize: 11, letterSpacing: "0.3em", marginBottom: 16 }}>
              // CAPABILITY MATRIX
            </div>
            <h2 className="bebas" style={{
              fontSize: "clamp(28px, 4vw, 52px)",
              color: "#e8e8f0",
              lineHeight: 1,
              marginBottom: 40,
            }}>
              TECHNICAL<br /><span style={{ color: "#00e5ff" }}>STACK</span>
            </h2>
          </div>
          {SKILLS.map((s, i) => (
            <div key={s.name} className="fade-up" style={{ marginBottom: 20, transitionDelay: `${i * 0.07}s` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span className="mono" style={{ fontSize: 11, color: "#8e8e98", letterSpacing: "0.08em" }}>{s.name}</span>
                <span className="mono" style={{ fontSize: 11, color: "#3a3a3a" }}>{s.pct}%</span>
              </div>
              <div style={{ height: 2, background: "#1a1a1a", borderRadius: 2, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${s.pct}%`,
                  background: i % 2 === 0
                    ? "linear-gradient(90deg, #00e5ff, rgba(0,229,255,0.4))"
                    : "linear-gradient(90deg, #ff6d00, rgba(255,109,0,0.4))",
                  borderRadius: 2,
                  transition: "width 1.5s ease",
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Certifications & tools */}
        <div className="fade-up" style={{ paddingTop: 60 }}>
          <div style={{
            background: "#0d0d0d",
            border: "1px solid #1a1a1a",
            padding: "32px 28px",
            marginBottom: 16,
          }}>
            <div className="mono" style={{ color: "#00e5ff", fontSize: 10, letterSpacing: "0.2em", marginBottom: 16 }}>
              CERTIFICATION
            </div>
            <div style={{ fontSize: 14, color: "#e8e8f0", marginBottom: 8, fontWeight: 600 }}>
              Python Essentials 1
            </div>
            <div style={{ fontSize: 12, color: "#5a5a64" }}>Cisco Networking Academy</div>
          </div>

          <div style={{
            background: "#0d0d0d",
            border: "1px solid #1a1a1a",
            padding: "32px 28px",
          }}>
            <div className="mono" style={{ color: "#ff6d00", fontSize: 10, letterSpacing: "0.2em", marginBottom: 16 }}>
              DEVELOPMENT ENVIRONMENT
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {["Asus TUF + GTX 1650 Ti", "16GB RAM workstation", "Samsung S22 Ultra (Test)", "Google Pixel (Test)", "Mobile Hotspot infra"].map(t => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 4, height: 4, background: "#ff6d00", borderRadius: "50%" }} />
                  <span className="mono" style={{ fontSize: 11, color: "#6e6e78" }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** TIMELINE SECTION */
function TimelineSection() {
  return (
    <section id="journey" style={{ padding: "120px 6vw", background: "#050505" }}>
      <div className="fade-up" style={{ marginBottom: 80 }}>
        <div className="mono" style={{ color: "#00e5ff", fontSize: 11, letterSpacing: "0.3em", marginBottom: 16 }}>
          // 03 — ENGINEERING MATRIX
        </div>
        <h2 className="bebas" style={{
          fontSize: "clamp(36px, 6vw, 72px)",
          color: "#e8e8f0",
          letterSpacing: "-0.01em",
          lineHeight: 1,
        }}>
          TRAJECTORY<br />
          <span style={{ color: "#ff6d00" }}>LOG</span>
        </h2>
      </div>

      <div style={{ position: "relative", maxWidth: 900, margin: "0 auto" }}>
        {/* Center vertical line */}
        <div className="timeline-line" />

        {TIMELINE.map((item, i) => (
          <div
            key={i}
            className="fade-up timeline-row"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              gap: 32,
              marginBottom: 64,
              transitionDelay: `${i * 0.15}s`,
            }}
          >
            {/* Left content or spacer */}
            {item.side === "left" ? (
              <div className="timeline-content" style={{ textAlign: "right" }}>
                <TimelineCard item={item} />
              </div>
            ) : (
              <div className="timeline-spacer" />
            )}

            {/* Center node */}
            <div className="timeline-node-col" style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0,
              position: "relative",
              zIndex: 2,
            }}>
              <div style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: item.accent === "blue" ? "#00e5ff" : "#ff6d00",
                border: `2px solid #050505`,
                boxShadow: `0 0 20px ${item.accent === "blue" ? "rgba(0,229,255,0.6)" : "rgba(255,109,0,0.6)"}`,
                marginTop: 24,
              }} />
            </div>

            {/* Right content or spacer */}
            {item.side === "right" ? (
              <div className="timeline-content">
                <TimelineCard item={item} />
              </div>
            ) : (
              <div className="timeline-spacer" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function TimelineCard({ item }) {
  return (
    <div style={{
      background: "#0d0d0d",
      border: `1px solid ${item.accent === "blue" ? "rgba(0,229,255,0.15)" : "rgba(255,109,0,0.15)"}`,
      padding: "24px 28px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <span className={`tag ${item.accent}`}>{item.date}</span>
        <span className={`tag ${item.accent}`}>{item.label}</span>
      </div>
      <h3 style={{
        fontSize: 15,
        fontWeight: 700,
        color: "#e8e8f0",
        marginBottom: 10,
        lineHeight: 1.4,
      }}>
        {item.title}
      </h3>
      <p className="mono" style={{ fontSize: 11, color: "#5a5a64", lineHeight: 1.8 }}>
        {item.detail}
      </p>
    </div>
  );
}

/** FOOTER / TERMINAL NODE */
function FooterSection() {
  const cmds = [
    `$ whoami`,
    `> vaibhav-karbhantnal`,
    `$ cat contact.json`,
    `> { "email": "${EMAIL}", "domain": "${DOMAIN}" }`,
    `$ status --check`,
    `> OPEN_TO: production-grade backend + ML systems`,
    `$ █`,
  ];

  return (
    <footer id="contact" style={{
      background: "#030303",
      borderTop: "1px solid #111",
      padding: "80px 6vw 48px",
    }}>
      <div className="footer-grid" style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 60,
        maxWidth: 1000,
        marginBottom: 64,
      }}>
        {/* Terminal */}
        <div>
          <div className="mono" style={{ color: "#3a3a3a", fontSize: 11, letterSpacing: "0.2em", marginBottom: 20 }}>
            // TERMINAL NODE
          </div>
          <div style={{
            background: "#080808",
            border: "1px solid #1a1a1a",
            padding: "24px 28px",
            borderRadius: 2,
            overflowX: "auto",
          }}>
            {cmds.map((cmd, i) => (
              <div key={i} className="mono" style={{
                fontSize: 12,
                lineHeight: 2,
                color: cmd.startsWith("$") ? "#00e5ff" : cmd.startsWith(">") ? "#8e8e98" : "#3a3a3a",
                whiteSpace: "nowrap",
              }}>
                {cmd}
              </div>
            ))}
          </div>
        </div>

        {/* Links */}
        <div>
          <div className="mono" style={{ color: "#3a3a3a", fontSize: 11, letterSpacing: "0.2em", marginBottom: 20 }}>
            // OPEN CHANNELS
          </div>
          <h2 className="bebas" style={{
            fontSize: "clamp(28px, 4vw, 52px)",
            color: "#e8e8f0",
            lineHeight: 1,
            marginBottom: 32,
          }}>
            LET'S BUILD<br />
            <span style={{ color: "#00e5ff" }}>SOMETHING.</span>
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <a
              href={`mailto:${EMAIL}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                textDecoration: "none",
                color: "#8e8e98",
                transition: "color 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.color = "#00e5ff"}
              onMouseLeave={e => e.currentTarget.style.color = "#8e8e98"}
            >
              <Mail size={16} />
              <span className="mono" style={{ fontSize: 12, wordBreak: "break-all" }}>{EMAIL}</span>
            </a>
            <a
              href={`https://${DOMAIN}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                textDecoration: "none",
                color: "#8e8e98",
                transition: "color 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.color = "#00e5ff"}
              onMouseLeave={e => e.currentTarget.style.color = "#8e8e98"}
            >
              <Globe size={16} />
              <span className="mono" style={{ fontSize: 12 }}>{DOMAIN}</span>
            </a>
            <a
              href={GITHUB_URL}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                textDecoration: "none",
                color: "#8e8e98",
                transition: "color 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.color = "#ff6d00"}
              onMouseLeave={e => e.currentTarget.style.color = "#8e8e98"}
            >
              <Github size={16} />
              <span className="mono" style={{ fontSize: 12 }}>github.com/NukGod-V</span>
            </a>
          </div>

          <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid #111" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["FastAPI", "XGBoost", "Flask", "MySQL", "Python", "ML Systems"].map(t => (
                <span key={t} className="tag">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom-bar" style={{
        borderTop: "1px solid #111",
        paddingTop: 24,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
      }}>
        <span className="mono" style={{ fontSize: 10, color: "#2a2a2a", letterSpacing: "0.15em" }}>
          © 2026 VAIBHAV KARBHANTNAL // Akka NukGod // ALL SYSTEMS OPERATIONAL
        </span>
        <span className="mono" style={{ fontSize: 10, color: "#2a2a2a", letterSpacing: "0.1em" }}>
          BUILT WITH R3F + FASTAPI PRECISION
        </span>
      </div>
    </footer>
  );
}

/** NAV */
function NavBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="site-nav" style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      padding: "16px 6vw",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: scrolled ? "rgba(5,5,5,0.92)" : "transparent",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      borderBottom: scrolled ? "1px solid #111" : "1px solid transparent",
      transition: "all 0.4s",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 8, height: 8,
          background: "#00e5ff",
          borderRadius: "50%",
          boxShadow: "0 0 10px #00e5ff",
        }} />
        <span className="mono" style={{ fontSize: 12, color: "#e8e8f0", letterSpacing: "0.15em" }}>
          VK.SYS
        </span>
      </div>

      {/* Nav links */}
      <div className="nav-links" style={{ display: "flex", gap: 32 }}>
        {[["SYSTEMS", "#projects"], ["JOURNEY", "#journey"], ["CONTACT", "#contact"]].map(([label, href]) => (
          <a
            key={href}
            href={href}
            className="mono"
            style={{
              fontSize: 10,
              color: "#3a3a3a",
              textDecoration: "none",
              letterSpacing: "0.2em",
              transition: "color 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "#00e5ff"}
            onMouseLeave={e => e.currentTarget.style.color = "#3a3a3a"}
          >
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────
export default function VaibhavPortfolio() {
  const mouse = useRef([0, 0]);

  // Inject styles
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Mouse tracking for 3D
  useEffect(() => {
    const onMouseMove = (e) => {
      mouse.current = [
        (e.clientX / window.innerWidth) * 2 - 1,
        (e.clientY / window.innerHeight) * 2 - 1,
      ];
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  useScrollReveal();

  return (
    <div style={{ background: "#050505", minHeight: "100vh" }}>
      {/* Atmospheric overlays */}
      <div className="scanlines" />
      <div className="grain" />

      {/* Cursor */}
      <CustomCursor />

      {/* Navigation */}
      <NavBar />

      {/* Sections */}
      <HeroSection mouse={mouse} />
      <ProjectsSection />
      <SkillsMatrix />
      <TimelineSection />
      <FooterSection />

      {/* Personal AI agent — floating chat widget, wired to /api/chat */}
      <ChatWidget />

      <Analytics />
    </div>
  );
}