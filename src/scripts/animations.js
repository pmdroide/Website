// Animations
// Icons parallax effect
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