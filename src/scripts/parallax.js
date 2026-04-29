const overlay = document.getElementById("overlay");

let targetProgress = 0;
let currentProgress = 0;

function lerp(a, b, t) {
    return a + (b - a) * t;
}

window.addEventListener("scroll", () => {
    targetProgress = Math.min(window.scrollY / 500, 1);
});

function animate() {
    currentProgress = lerp(currentProgress, targetProgress, 0.04);

    // 👉 THIS is the magic: gradient "height"
    let gradientStart = 100 - (currentProgress * 100); 
    // 100% → 0% (bottom → full screen)

    // Opacity stays capped (no solid black)
    let baseOpacity = 0.7 * currentProgress;
    let midOpacity = 0.3 * currentProgress;

    overlay.style.background = `
        linear-gradient(
            to top,
            rgba(0,0,0,${baseOpacity}) 0%,
            rgba(0,0,0,${midOpacity}) ${gradientStart}%,
            rgba(0,0,0,0) 100%
        )
    `;

    // Smooth blur
    let blur = Math.min(currentProgress * 6, 6);
    overlay.style.backdropFilter = `blur(${blur}px)`;
    overlay.style.webkitBackdropFilter = `blur(${blur}px)`;

    requestAnimationFrame(animate);
}

animate();