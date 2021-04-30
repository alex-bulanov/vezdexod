import {Swiper, Parallax, Mousewheel, Controller, Pagination, Scrollbar, Navigation} from 'swiper';
import {gsap, Power2} from 'gsap';
import MicroModal from 'micromodal';

Swiper.use([Parallax, Mousewheel, Controller, Pagination, Scrollbar, Navigation]);

document.addEventListener('DOMContentLoaded', () => {

  const gear = document.querySelector('.sliders__gear');
  const sliderImages = new Swiper('.sliders__images', {
    wrapperClass: 'sliders__wrapper',
    slideClass: 'sliders__slide',
    loop: false,
    speed: 2400,
    parallax: true,
    pagination: {
      el: '.sliders__count-total',
      type: 'custom',
      renderCustom: function (slider, current, total) {
        const totalRes = total >= 10 ? total : '0' + total;
        return totalRes;
      },
    },
  });
  const sliderText = new Swiper('.sliders__text', {
    wrapperClass: 'sliders__wrapper',
    slideClass: 'sliders__slide',
    loop: false,
    speed: 2400,
    mousewheel: {
      invert: false,
    },
    pagination: {
      el: '.sliders__pagination',
      clickable: true,
      bulletElement: 'div',
      bulletClass: 'sliders__pagination-bullet',
      bulletActiveClass: 'sliders__pagination-bullet--active',
      renderBullet: function (index, className) {
        return '<div class="' + className + '">' + '</div>';
      },

    },
    scrollbar: {
      el: '.sliders__scrollbar',
      dragClass: 'sliders__scrollbar-drag',
      draggable: true,
    },
    navigation: {
      nextEl: '.sliders__navigation-button--next',
      prevEl: '.sliders__navigation-button--prev',
      disabledClass: 'sliders__navigation-button--disabled',
    },
  });

  const currentNum = document.querySelector('.sliders__count-current');
  const pageCurrent = document.querySelector('.sliders__current-num');

  sliderImages.controller.control = sliderText;
  sliderText.controller.control = sliderImages;

  sliderText.on('slideNextTransitionStart', () => {
    gsap.to(gear, 2.8, {
      rotation: '+=40',
      ease: Power2.easeOut,
    });
  });

  sliderText.on('slidePrevTransitionStart', () => {
    gsap.to(gear, 2.8, {
      rotation: '-=40',
      ease: Power2.easeOut,
    });
  });

  sliderText.on('slideChange', () => {
    const index = sliderText.realIndex + 1;
    const indexRes = index >= 10 ? index : '0' + index;
    gsap.to(currentNum, 0.2, {
      force3D: true,
      y: -10,
      opacity: 0,
      ease: Power2.easeOut,
      onComplete: function () {
        gsap.to(currentNum, 0.1, {
          force3D: true,
          y: 10,
        });
        currentNum.innerHTML = indexRes;
        pageCurrent.innerHTML = indexRes;
      },
    });

    gsap.to(currentNum, 0.2, {
      force3D: true,
      y: 0,
      opacity: 1,
      ease: Power2.easeOut,
      delay: 0.3,
    });
  });

  MicroModal.init({
    openTrigger: 'data-micromodal-open',
    closeTrigger: 'data-micromodal-close',
    disableFocus: true,
    disableScroll: true,
    awaitOpenAnimation: true,
    awaitCloseAnimation: true,
  });

  // cursor

  const body = document.querySelector('body');
  const cursor = document.querySelector('.cursor');
  const links = document.getElementsByTagName('a');

  let mouseX = 0;
  let mouseY = 0;
  let posX = 0;
  let posY = 0;

  function mouseCoords(event) {
    mouseX = event.pageX;
    mouseY = event.pageY;
  }

  gsap.to({}, 0.01, {
    repeat: -1,
    onRepeat: () => {
      posX += (mouseX - posX) / 5;
      posY += (mouseY - posY) / 5;
      gsap.set(cursor, {
        css: {
          left: posX,
          top: posY,
        },
      });
    },
  });

  for (let i; i <= links.length; i++) {
    links[i].addEventListener('mouseover', () => {
      cursor.classList.add('cursor--active');
    });

    links[i].addEventListener('mouseout', () => {
      cursor.classList.remove('cursor--active');
    });
  }

  body.addEventListener('mousemove', (event) => {
    mouseCoords(event);
    cursor.classList.remove('cursor--hidden');
  });

  body.addEventListener('mouseout', () => {
    cursor.classList.add('cursor--hidden');
  });
});
