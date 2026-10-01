/**
 * Fluted Glass WebGL Background Shader
 * Creates an interactive fluted glass refraction effect synced with hero photography.
 */

function initFlutedGlass(canvasId = 'c') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const gl = canvas.getContext('webgl', { antialias: false, alpha: false });

  const vert = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;

  const frag = `
  precision highp float;
  uniform vec2  res;
  uniform float time;
  uniform vec2  mouse;   // 0..1, y up
  uniform float press;   // 0..1 energy from hover / touch
  uniform float ribs;    // number of flutes across width

  float aspect;

  // soft out-of-focus scene seen through the glass: broad grey light bands
  float scene(vec2 s, float t){
    vec2 q = vec2(s.x * aspect, s.y);
    float a = sin(q.x * 2.1 + q.y * 1.7 - t * 0.28);
    float b = sin(q.x * 1.0 - q.y * 2.3 + t * 0.19 + 1.7);
    float c = sin(q.x * 3.6 + q.y * 0.9 + t * 0.11) * 0.28;
    float v = a * 0.62 + b * 0.5 + c;
    // light that follows the pointer
    vec2 m = vec2(mouse.x * aspect, mouse.y);
    float d = length(q - m);
    v += (0.9 + press * 1.4) * exp(-d * d * 5.0) * sin(t * 0.6 + d * 5.0);
    return smoothstep(-0.65, 0.65, v);
  }

  vec3 tone(float v){
    vec3 dark  = vec3(0.020, 0.022, 0.034);
    vec3 light = vec3(0.80, 0.81, 0.86);
    return mix(dark, light, pow(v, 0.9));
  }

  // one colour channel through the flute lens
  float chan(vec2 uv, float id, float t, float w, float disp, float tm){
    float k = 2.3;
    float lens = sign(t) * pow(abs(t), k);
    float sx = (id + 0.5) / ribs + lens * w * disp / ribs;
    float sy = uv.y + t * t * 0.05 * sin(tm * 0.2 + id * 0.5);
    return scene(vec2(sx, sy), tm);
  }

  void main(){
    vec2 uv = gl_FragCoord.xy / res;
    aspect = res.x / res.y;
    float tm = time;

    float x  = uv.x * ribs;
    float id = floor(x);
    float t  = fract(x) * 2.0 - 1.0;

    // pointer bends the glass nearby
    float md = distance(vec2(uv.x * aspect, uv.y), vec2(mouse.x * aspect, mouse.y));
    float infl = exp(-md * md * 7.0) * (0.45 + press * 0.9);
    float w = 1.35 + 0.25 * sin(tm * 0.15 + uv.y * 2.0) + infl;

    // chromatic dispersion: red/blue refract slightly differently
    float d = 0.06 + infl * 0.05;
    float r = chan(uv, id, t, w, 1.0 + d, tm);
    float g = chan(uv, id, t, w, 1.0,     tm);
    float b = chan(uv, id, t, w, 1.0 - d, tm);

    vec3 col = vec3(tone(r).r, tone(g).g, tone(b).b);

    // warm / cool fringes where the lens sweeps fast near flute edges
    float edge = pow(abs(t), 6.0);
    col += edge * vec3(0.10, 0.045, -0.02) * step(0.0, t);
    col += edge * vec3(-0.03, 0.03, 0.12)  * step(t, 0.0);

    // fine dark seam between flutes
    col *= 0.55 + 0.45 * smoothstep(0.0, 0.10, 1.0 - abs(t));

    // soft vignette
    float vg = smoothstep(1.25, 0.25, distance(uv, vec2(0.5)));
    col *= 0.75 + 0.25 * vg;

    gl_FragColor = vec4(col, 1.0);
  }`;

  function sh(type, src){
    const s = gl.createShader(type);
    gl.shaderSource(s, src); 
    gl.compileShader(s);
    return s;
  }

  if (!gl) {
    document.body.style.background = 'linear-gradient(115deg,#0b0b0e,#8e909a 45%,#0b0b0e)';
    return;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vert));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const U = n => gl.getUniformLocation(prog, n);
  const uRes = U('res'), uTime = U('time'), uMouse = U('mouse'), uPress = U('press'), uRibs = U('ribs');

  let W = 0, H = 0, ribs = 16;
  function resize(){
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.floor(window.innerWidth * dpr); 
    H = Math.floor(window.innerHeight * dpr);
    canvas.width = W; 
    canvas.height = H;
    gl.viewport(0, 0, W, H);
    const ribPx = Math.min(Math.max(window.innerWidth / 15, 52), 110) * dpr;
    ribs = W / ribPx;
  }
  window.addEventListener('resize', resize);
  resize();

  // pointer / touch state & external pulse API
  const target = { x: 0.5, y: 0.5, p: 0 };
  const cur = { x: 0.5, y: 0.5, p: 0 };
  let active = false, down = false, lastMove = 0;
  let pulseEnergy = 0;

  function setPos(e){
    target.x = e.clientX / window.innerWidth;
    target.y = 1 - e.clientY / window.innerHeight;
    lastMove = performance.now();
  }

  // Global API for hero interaction sync
  window.triggerGlassPulse = function(energy = 1.0) {
    pulseEnergy = Math.min(pulseEnergy + energy, 2.0);
    lastMove = performance.now();
  };

  window.setGlassTargetPos = function(normalizedX, normalizedY) {
    active = true;
    target.x = normalizedX;
    target.y = normalizedY;
    lastMove = performance.now();
  };

  canvas.addEventListener('pointermove', e => { active = true; setPos(e); });
  canvas.addEventListener('pointerdown', e => { active = true; down = true; setPos(e); cur.x = target.x; cur.y = target.y; });
  window.addEventListener('pointerup',     () => { down = false; });
  window.addEventListener('pointercancel', () => { down = false; active = false; });
  canvas.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') active = false; });

  // Sync mouse events anywhere on the document (hero images included)
  window.addEventListener('pointermove', e => {
    setPos(e);
  }, { passive: true });

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const t0 = performance.now();
  let tm = 0, last = t0;

  function frame(now){
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    tm += dt * (reduce ? 0.3 : 1);

    // Decay pulse energy smoothly
    if (pulseEnergy > 0) {
      pulseEnergy *= Math.pow(0.05, dt);
      if (pulseEnergy < 0.01) pulseEnergy = 0;
    }

    // idle drift when nobody is interacting
    if (!active || now - lastMove > 3500) {
      target.x = 0.5 + 0.32 * Math.sin(tm * 0.21);
      target.y = 0.5 + 0.28 * Math.cos(tm * 0.17);
    }
    const wantP = down ? 1 : (active ? 0.45 : 0.1) + pulseEnergy;
    const k = 1 - Math.pow(0.0015, dt);
    cur.x += (target.x - cur.x) * k;
    cur.y += (target.y - cur.y) * k;
    cur.p += (wantP - cur.p) * (1 - Math.pow(0.01, dt));

    gl.uniform2f(uRes, W, H);
    gl.uniform1f(uTime, tm);
    gl.uniform2f(uMouse, cur.x, cur.y);
    gl.uniform1f(uPress, cur.p);
    gl.uniform1f(uRibs, ribs);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

document.addEventListener('DOMContentLoaded', () => {
  initFlutedGlass('c');
});
