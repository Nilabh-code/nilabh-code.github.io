#!/usr/bin/env node
/* nilabh.is-a.dev — personal site generator.
   node build.js [baseUrl] */
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const BASE = (process.argv[2] || '').replace(/\/$/, '');

const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

const PROJECTS = [
  {
    name: 'Robot Atlas',
    url: 'https://nilabh-code.github.io/robot-atlas/',
    repo: 'https://github.com/Nilabh-code/robot-atlas',
    year: '2026',
    status: 'live',
    stack: ['HTML', 'Node'],
    blurb: 'A field guide to robotics hardware: 57 parts across seven subsystems with real specs, prices and the failure mode nobody documents, plus 18 platforms taken apart the same way and an eight-step build roadmap for getting started.',
    why: 'I kept re-deriving the same torque budgets and losing the same gotchas. Now it is written down.',
  },
  {
    name: 'ReBench',
    url: null,
    repo: 'https://github.com/Nilabh-code/ReBench',
    year: '2026',
    status: 'building',
    stack: ['TypeScript'],
    blurb: 'Open, reproducible AI benchmarks run by the community rather than one lab. The point is that anyone can rerun the measurement and check the number.',
    why: 'Benchmark claims are unfalsifiable if nobody can reproduce them.',
  },
  {
    name: 'rag-simplified',
    url: null,
    repo: 'https://github.com/Nilabh-code/rag-simplified',
    year: '2026',
    status: 'building',
    stack: ['Python', 'FastAPI', 'MCP'],
    blurb: 'An educational RAG product you can actually run: retrieval engine, a FastAPI interface, and an MCP server, built so the internals are visible instead of hidden behind a framework.',
    why: 'RAG is explained badly everywhere. Build one and the explanation is the code.',
  },
  {
    name: 'HackRAG',
    url: null,
    repo: null,
    year: '2026',
    status: 'local',
    stack: ['Python', 'BM25', 'Rerank'],
    blurb: 'A retrieval system over 122,000 chunks from 22 offensive-security sources, with hybrid BM25 plus dense retrieval and a reranker on top. Built to answer questions from primary material instead of blog spam.',
    why: 'The best security writing is buried in wikis nobody indexes properly.',
  },
  {
    name: 'roszebo',
    url: null,
    repo: 'https://github.com/Nilabh-code/roszebo',
    year: '2026',
    status: 'building',
    stack: ['TypeScript', 'MuJoCo-WASM', 'WebGL'],
    blurb: 'A natural-language robot builder. Describe a robot, get a compiled RobotSpec out to URDF, ROS 2 or MJCF, then simulate it in the browser with real physics and client-side sensor rendering.',
    why: 'The gap between "I want a robot" and a simulatable model should be one sentence.',
  },
  {
    name: 'VM-Fleet',
    url: null,
    repo: 'https://github.com/Nilabh-code/VM-Fleet',
    year: '2026',
    status: 'building',
    stack: ['Python'],
    blurb: 'Managing a fleet of ephemeral VMs for parallel work — provisioning, isolation, teardown — so long-running jobs stop queueing behind each other.',
    why: 'One machine is a serial bottleneck I got tired of.',
  },
  {
    name: 'deep-diver',
    url: null,
    repo: 'https://github.com/Nilabh-code/deep-diver',
    year: '2026',
    status: 'building',
    stack: ['Python'],
    blurb: 'Recursive research tooling: build a question, expand it into sub-questions, retrieve per branch, and synthesise with citations that survive the expansion.',
    why: 'Attribution collapses when you summarise a summary.',
  },
  {
    name: 'calcforge',
    url: 'https://nilabh-code.github.io/calcforge/',
    repo: 'https://github.com/Nilabh-code/calcforge',
    year: '2026',
    status: 'live',
    stack: ['HTML', 'Node'],
    blurb: 'A hub of Indian personal-finance calculators generated from a single spec file — one build script, distinct formulas per tool, zero framework.',
    why: 'The ones that exist are either wrong or unusable on a phone.',
  },
  {
    name: 'PD-band',
    url: null,
    repo: 'https://github.com/Nilabh-code/PD-band',
    year: '2026',
    status: 'archived',
    stack: ['HTML', 'TypeScript'],
    blurb: 'A band website built end to end, from layout to content structure.',
    why: 'A friend needed one. Good exercise in shipping something someone else uses.',
  },
];

const STACK = [
  ['Python', 'Most of what I write. ML, tooling, backends, anything that has to think.'],
  ['C++ / CUDA', 'When the loop has a deadline or the tensor has to leave the CPU.'],
  ['TypeScript', 'Web apps, interfaces, and anything that has to run in a browser.'],
  ['ESP32 / STM32', 'Firmware for motors, sensors and the real-time half of a robot.'],
  ['ROS 2 / MuJoCo', 'Simulation and the robot software stack around it.'],
  ['3D printing / CAD', 'Bambu Lab A1. If a part does not exist, print it.'],
];

const ICON = {
  logo: `<path d="M8 8h8v8H8zM10 8V5.5h4V8M10 16v2.5M14 16v2.5M5 11h3M16 11h3"/>`,
  arrow: `<path d="M5 12h14M13 6l6 6-6 6"/>`,
  ext: `<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/>`,
  gh: `<path d="M9 19c-4 1.5-4-2-6-2.5m12 5v-3.9a3.4 3.4 0 00-.9-2.6c3-.3 6.1-1.5 6.1-6.7a5.2 5.2 0 00-1.4-3.6 4.9 4.9 0 00-.1-3.6s-1.1-.3-3.6 1.4a12.4 12.4 0 00-6.5 0C6.1 1.1 5 1.4 5 1.4a4.9 4.9 0 00-.1 3.6A5.2 5.2 0 003.5 8.7c0 5.2 3.1 6.4 6.1 6.7a3.4 3.4 0 00-.9 2.6V24"/>`,
};

function shell({ title, desc, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${BASE}/">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${BASE}/">
<meta name="theme-color" content="#E9E6E1">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%23FFD21E'/%3E%3Cpath d='M8 8h8v8H8zM10 8V5.5h4V8M10 16v2.5M14 16v2.5M5 11h3M16 11h3' stroke='%231A1A1A' stroke-width='1.5' fill='none'/%3E%3C/svg%3E">
<link rel="stylesheet" href="style.css">
<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Person', name: 'Nilabh Yadav',
    url: BASE + '/', jobTitle: 'Robotics and AI engineer (student)',
    sameAs: ['https://github.com/Nilabh-code',
             'https://www.youtube.com/@NilabhTechForge',
             'https://nilabh-code.github.io/robot-atlas/'],
  })}</script>
</head>
<body>
<div class="wrap">
  <header class="site-head"><div class="head-in">
    <a class="brand" href="#top">
      <span class="logo-tile"><svg viewBox="0 0 24 24">${ICON.logo}</svg></span>
      <span class="wordmark">Nilabh Yadav</span>
    </a>
    <nav class="head-actions">
      <a class="pill" href="#work">Work</a>
      <a class="pill" href="#stack">Stack</a>
      <a class="pill" href="https://github.com/Nilabh-code" target="_blank" rel="noopener">GitHub</a>
      <a class="pill pill--primary" href="https://nilabh-code.github.io/robot-atlas/">
        <span class="pill-ico"><svg viewBox="0 0 24 24">${ICON.arrow}</svg></span>
        Robot Atlas
      </a>
    </nav>
  </div></header>

  <main id="top">
    <section class="hero-card">
      <div class="eyebrow"><span class="dot"></span>Robotics · AI · Systems</div>
      <h1>I build machines that <mark>sense, think and move</mark> — and the software that makes them legible.</h1>
      <p class="sub">Sixteen, class 11, Gurugram. I work on local LLMs, robot hardware, retrieval systems and the tooling in between. I would rather ship a working artifact than describe one, so most of what is below runs.</p>
      <div class="hero-pills">
        <span class="stat-pill"><b>${PROJECTS.length}</b> <span>projects</span></span>
        <span class="stat-pill"><b>3</b> <span>live sites</span></span>
        <span class="stat-pill"><b>57</b> <span>parts catalogued</span></span>
        <a class="pill pill--primary" href="https://github.com/Nilabh-code">
          <span class="pill-ico"><svg viewBox="0 0 24 24">${ICON.gh}</svg></span>
          github.com/Nilabh-code
        </a>
      </div>
    </section>

    <section class="card" id="work">
      <div class="card-head">
        <div>
          <h2>Work</h2>
          <p class="card-sub">Ordered by how much of it I would defend. Live links where something is deployed; repo links where it is code only.</p>
        </div>
      </div>
      <div class="grid g2">
        ${PROJECTS.map(p => `<article class="tile">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
            <div>
              <h3>${p.url ? `<a href="${p.url}" target="_blank" rel="noopener">${esc(p.name)}</a>` : `<a href="${p.repo || '#'}" target="_blank" rel="noopener">${esc(p.name)}</a>`}</h3>
              <p style="font-size:11.5px;font-weight:500">${p.year} · ${p.stack.join(' · ')}</p>
            </div>
            <span class="chip${p.status === 'live' ? ' chip--yellow' : ''}">${p.status}</span>
          </div>
          <p>${esc(p.blurb)}</p>
          <p style="border-top:1.5px dashed var(--hairline);padding-top:10px;font-style:italic">${esc(p.why)}</p>
          <div class="tile-foot">
            <span>${p.repo ? `<a href="${p.repo}" target="_blank" rel="noopener">Repo →</a>` : 'private'}</span>
            ${p.url ? `<b><a href="${p.url}" target="_blank" rel="noopener">Live site →</a></b>` : ''}
          </div>
        </article>`).join('')}
      </div>
    </section>

    <section class="card" id="stack">
      <div class="card-head">
        <div>
          <h2>What I work with</h2>
          <p class="card-sub">Not a wish list — these are the things I have shipped with and would pick again.</p>
        </div>
      </div>
      <div class="grid g3">
        ${STACK.map(([n, d]) => `<div class="tile"><h3>${esc(n)}</h3><p>${esc(d)}</p></div>`).join('')}
      </div>
    </section>

    <section class="card">
      <div class="card-head">
        <div>
          <h2>Currently</h2>
          <p class="card-sub">Where the hours are going this month.</p>
        </div>
      </div>
      <div class="grid g2">
        <div class="callout yellow">
          <h3><span class="dot"></span>Robot Atlas</h3>
          <p>Turning a personal reference into something other people can start from — an eight-step build roadmap, 57 catalogued parts, 18 platforms pulled apart. The hard part is not the specs, it is saying honestly where each one fails.</p>
        </div>
        <div class="callout">
          <h3><span class="dot"></span>Sim-to-real on a budget</h3>
          <p>Training locomotion policies in MuJoCo and trying to transfer them to hardware built from cheap serial servos. The gap between a policy that walks in simulation and one that survives a real floor is turning out to be entirely mechanical.</p>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="card-head">
        <div>
          <h2>Elsewhere</h2>
          <p class="card-sub">I write and record about local models, Raspberry Pi, 3D printing and robot builds.</p>
        </div>
      </div>
      <ul class="link-list">
        <li><a href="https://github.com/Nilabh-code" target="_blank" rel="noopener"><span>GitHub — Nilabh-code</span><span class="lm">all the code</span></a></li>
        <li><a href="https://www.youtube.com/@NilabhTechForge" target="_blank" rel="noopener"><span>YouTube — Nilabh's Tech Forge</span><span class="lm">tutorials</span></a></li>
        <li><a href="https://nilabh-code.github.io/robot-atlas/" target="_blank" rel="noopener"><span>Robot Atlas</span><span class="lm">field guide</span></a></li>
        <li><a href="https://nilabh-code.github.io/calcforge/" target="_blank" rel="noopener"><span>CalcForge</span><span class="lm">calculators</span></a></li>
      </ul>
    </section>
  </main>

  <footer class="site-foot"><div class="foot-card">
    <p>Nilabh Yadav — builder, Gurugram, India. This site is static HTML generated from a single script, because a personal site should not need a framework.</p>
    <nav class="foot-links">
      <a class="pill" href="https://github.com/Nilabh-code" target="_blank" rel="noopener">GitHub</a>
      <a class="pill" href="#top">Back to top</a>
    </nav>
  </div></footer>
</div>
</body></html>`;
}

fs.writeFileSync(path.join(ROOT, 'index.html'), shell({
  title: 'Nilabh Yadav — robotics, AI and systems',
  desc: 'Nilabh Yadav builds robots, local AI systems and the tooling around them. Robot hardware, retrieval systems, simulation, and the sites that document them.',
  body: '',
}));
fs.copyFileSync(path.join(ROOT, 'src', 'style.css'), path.join(ROOT, 'style.css'));
console.log('built index.html + style.css');
console.log('base:', BASE || '(none)');
