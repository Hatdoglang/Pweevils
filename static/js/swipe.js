let mySwiper = new Swiper('.container1', {
  effect: 'coverflow',
  grabCursor: true,
  centeredSlides: true,
  loop: true,
  slidesPerView: 'auto',
  coverflowEffect: {
    rotate: 0,
    stretch: 1,
    depth: 300,
    modifier: 5
  },
  pagination: {
    el: '.swiper-pagination',
    clickable: true
  },
  autoplay: {
    delay: 3000, // Adjust delay as needed (in milliseconds)
    disableOnInteraction: false // Allow user interaction to not disable autoplay
  }
});
