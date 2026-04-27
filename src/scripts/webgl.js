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
  uniform vec2 u_mouse;      
  uniform sampler2D u_mainScene;
  uniform vec2 u_resolution; // Importante para manter a proporção correta

  void main() {
      // 1. Ajuste de Proporção para Esticar na Vertical
      vec2 center = vec2(0.5, 0.5);
      vec2 centeredUv = vUv - center;

      // Criamos uma variável para o cálculo da distância "deformada"
      // Ao multiplicar o Y por um fator (ex: 0.6), o círculo vira uma elipse
      // que se expande para cima e para baixo.
      vec2 stretchedUv = centeredUv;
      stretchedUv.y *= 0.4; // Menor que 1.0 = Estica na vertical / Maior que 1.0 = Achata
      
      // 2. Criar a "Escada" de Círculos Elípticos
      float dist = length(stretchedUv); 
      float numCuts = 5.0; // Diminuir o número de cortes faz os anéis parecerem maiores
      float ringId = floor(dist * numCuts);
      
      // 3. Cálculo de Movimento
      // Multiplicamos o ringId para garantir que o movimento acompanhe a escala
      float movementIntensity = 0.02 + (ringId * 0.04);
      vec2 ringOffset = u_mouse * movementIntensity;

      // 4. Zoom de Segurança
      // Como os anéis estão maiores, talvez você precise de mais zoom
      centeredUv *= 0.8; 

      // 5. Sample da Textura
      vec2 finalUv = (centeredUv + center) + ringOffset;
      vec4 tex = texture2D(u_mainScene, clamp(finalUv, 0.0, 1.0));

      // 6. Cores e Vinheta
      float luma = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
      vec3 darkBlue = vec3(0.02, 0.03, 0.11);
      vec3 lightBlue = vec3(0.4, 0.6, 1.0);
      vec3 finalTone = mix(darkBlue, lightBlue, smoothstep(0.1, 0.95, luma));

      // Ajustamos a vinheta para também ser elíptica acompanhando os anéis
      float vignette = smoothstep(0.8, 0.2, dist);
      
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
const targetMouse = { x: 0.5, y: 0.5 };
const currentMouse = { x: 0.5, y: 0.5 };

window.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();

  targetMouse.x = (event.clientX - rect.left) / rect.width;
  targetMouse.y = 1 - (event.clientY - rect.top) / rect.height;
});

window.addEventListener("mouseleave", () => {
  targetMouse.x = 0.5;
  targetMouse.y = 0.5;
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
  const lerpSpeed = 0.04; 

  // LERP (smooth follow)
  currentMouse.x += (targetMouse.x - currentMouse.x) * lerpSpeed;
  currentMouse.y += (targetMouse.y - currentMouse.y) * lerpSpeed;

  gl.uniform1f(timeLoc, time * 0.001);
  gl.uniform2f(resolutionLoc, canvas.width, canvas.height);

  // use SMOOTHED mouse
  gl.uniform2f(mouseLoc, currentMouse.x, currentMouse.y);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  requestAnimationFrame(render);
}

if (image.complete) {
  setupTextureAndRender();
} else {
  image.onload = setupTextureAndRender;
}