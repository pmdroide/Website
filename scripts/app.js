// WebGL
const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl");
const image = document.getElementById("bg");

if (!gl) {
  throw new Error("WebGL is not supported in this browser.");
}

const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 vUv;

  void main() {
      // Map -1 to +1 positions to 0.0 to 1.0 UV coordinates
      vUv = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;

  varying vec2 vUv;
  uniform vec2 u_mouse;      // Mouse de -0.5 a 0.5
  uniform sampler2D u_mainScene;

  void main() {
      // 1. Configuração das Fatias (Slices)
      float numSlices = 7.0; 
      float currentSlice = floor(vUv.x * numSlices);
      float centeredSlice = currentSlice - floor(numSlices * 0.5);
      
      // 2. Movimento (Horizontal Shatter + Vertical Tilt)
      // O movimento horizontal depende da fatia (mais longe do centro = mais shift)
      float horizMovement = abs(centeredSlice) * 0.08;
      float xOffset = u_mouse.x * horizMovement;
      
      // O movimento vertical é uniforme (efeito de inclinação da câmera)
      float yOffset = u_mouse.y * 0.04;

      // 3. Distorção de Coordenadas
      vec2 distortedUv = vec2(vUv.x + xOffset, vUv.y + yOffset);

      // 4. Sample da Textura Original
      // Usamos clamp para evitar repetição nas bordas ao mover
      vec4 tex = texture2D(u_mainScene, clamp(distortedUv, 0.0, 1.0));

      // 5. Seu Esquema de Cores Customizado
      // Calcula a luminosidade (preto e branco) da imagem original
      float luma = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
      
      vec3 darkBlue = vec3(0.02, 0.03, 0.11);
      vec3 lightBlue = vec3(0.4, 0.6, 1.0);
      vec3 blue = vec3(0.1, 0.2, 0.8);
      vec3 deepBlue = vec3(0.0, 0.1, 0.5);
      
      // Mapeia o Luma para o gradiente entre azul escuro e vermelho profundo
      vec3 finalTone = mix(deepBlue, lightBlue, smoothstep(0.1, 0.95, luma));

      // 6. Ajuste de Vinheta (Opcional, para dar profundidade)
      float distFromCenter = distance(vUv, vec2(0.5));
      float vignette = smoothstep(0.8, 0.4, distFromCenter);
      
      // Aplicamos o tom final com um leve efeito de vinheta
      gl_FragColor = vec4(finalTone * (vignette + 0.2), 1.0);
  }
`;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// --- Shader helpers ---
function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

function createProgram(gl, vShader, fShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);
  gl.linkProgram(program);
  return program;
}

const vShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vShader, fShader);

gl.useProgram(program);

// Fullscreen quad
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
     1,  1
  ]),
  gl.STATIC_DRAW
);

const posLoc = gl.getAttribLocation(program, "a_position");
gl.enableVertexAttribArray(posLoc);
gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

// Texture
const texture = gl.createTexture();
const textureLoc = gl.getUniformLocation(program, "u_texture");
const timeLoc = gl.getUniformLocation(program, "u_time");
const resolutionLoc = gl.getUniformLocation(program, "u_resolution");
const mouseLoc = gl.getUniformLocation(program, "u_mouse");
const mouse = { x: 0.5, y: 0.5 };

window.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = (event.clientX - rect.left) / rect.width;
  mouse.y = 1 - (event.clientY - rect.top) / rect.height;

  if (mouse.x < 0 || mouse.x > 1 || mouse.y < 0 || mouse.y > 1) {
    mouse.x = 0.5;
    mouse.y = 0.5;
  }
});

window.addEventListener("mouseleave", () => {
  mouse.x = 0.5;
  mouse.y = 0.5;
});

function setupTextureAndRender() {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.uniform1i(textureLoc, 0);
  render();
}

function render(time = 0) {
  gl.uniform1f(timeLoc, time * 0.001);
  gl.uniform2f(resolutionLoc, canvas.width, canvas.height);
  gl.uniform2f(mouseLoc, mouse.x, mouse.y);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  requestAnimationFrame(render);
}

if (image.complete) {
  setupTextureAndRender();
} else {
  image.onload = setupTextureAndRender;
}

// Header
// Burger
const burger = document.getElementById('burger');
  const nav = document.getElementById('nav-menu');

  burger.addEventListener('click', () => {
    nav.classList.toggle('active');
    burger.classList.toggle('active');
});

// Animations
const logos = document.querySelectorAll('.logo-item');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show');
    }
  });
}, {
  threshold: 0.2
});

logos.forEach(logo => observer.observe(logo));

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;

  document.querySelectorAll('.logo-item').forEach((logo, i) => {
    const speed = (i % 2 === 0) ? 0.05 : 0.1;

    if (logo.classList.contains('show')) {
      logo.style.transform = `
        translateY(${scrollY * speed}px)
        scale(1)
      `;
    }
  });
});