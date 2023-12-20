export const slideConfig = {
  slidesToShow: 3,
  slidesToScroll: 1,
  dots: true,
  infinite: true,
  autoplay: true,
  autoplaySpeed: 1700,
  centerMode: true,
  responsive: [
    {
      breakpoint: 768,
      settings: {
        slidesToShow: 2
      }
    },
    {
      breakpoint: 520,
      settings: {
        slidesToShow: 1
      }
    }
  ],
}

export const slideConfigStatic = {
  slidesToShow: 2,
  slidesToScroll: 1,
  dots: true,
  infinite: true,
  responsive: [
    {
      breakpoint: 768,
      settings: {
        slidesToShow: 2
      }
    },
    {
      breakpoint: 520,
      settings: {
        slidesToShow: 1
      }
    }
  ],
}