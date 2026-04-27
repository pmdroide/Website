// Burger
const burger = document.getElementById('burger');
  const nav = document.getElementById('nav-menu');

  burger.addEventListener('click', () => {
    nav.classList.toggle('active');
    burger.classList.toggle('active');

    document.body.classList.toggle('menu-open');
});

// Close when clicking link
document.querySelectorAll('.nav a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('active');
    burger.classList.remove('active');
    document.body.classList.remove('menu-open');
  });
});

// Header and hero scroll effect
const header = document.querySelector('.header');
const hero = document.querySelector('.hero');

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;

  if (scrollY > 80) {
    header.classList.add('scrolled');
    hero.classList.add('shrink');
    nav.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
    hero.classList.remove('shrink');
    nav.classList.remove('scrolled');
  }
});