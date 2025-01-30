import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import Carousel from "./Carousel";

describe("Carousel Component", () => {
  const imageUrls = [
    "http://example.com/image1.jpg",
    "http://example.com/image2.jpg",
    "http://example.com/image3.jpg",
    "http://example.com/image4.jpg",
    "http://example.com/image5.jpg",
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllTimers();
    
  });

  it("renders the correct number of slides (3 x slidesToShow)", () => {
    const slidesToShow = 2;
    render(<Carousel imageUrls={imageUrls} slidesToShow={slidesToShow} />);

    const slides = screen.getAllByRole("img", { name: /^carousel-image-/i });
    expect(slides.length).toBe(slidesToShow * 3);
  });

  it("initially translates to the correct position (currentIndexRef = slidesToShow)", () => {
    const slidesToShow = 3;
    render(<Carousel imageUrls={imageUrls} slidesToShow={slidesToShow} />);

    const container = screen.getByTestId("carousel-container");

    expect(container).toHaveStyle("transform: translate3d(-100%, 0, 0)");
  });

  it("wheel event moves to the next slide (deltaY > 0 => increment index)", () => {
    const slidesToShow = 2;
    render(<Carousel imageUrls={imageUrls} slidesToShow={slidesToShow} transitionInSeconds={0.3} />);

    const container = screen.getByTestId("carousel-container");

    fireEvent.wheel(container, { deltaY: 100 });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(container).toHaveStyle("transform: translate3d(-50%, 0, 0)");
  });

  it("moves to next/prev slide on wheel (throttled)", async () => {
    vi.useFakeTimers();
    render(
      <Carousel imageUrls={imageUrls} slidesToShow={1} transitionInSeconds={0.5} />
    );

    const carouselContainer = screen.getByTestId("carousel-container");

    fireEvent.wheel(carouselContainer, { deltaY: 50 });
    fireEvent.wheel(carouselContainer, { deltaY: -50 });

    expect(carouselContainer).toHaveStyle("transform: translate3d(-0%, 0, 0)");

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(carouselContainer).toHaveStyle("transform: translate3d(-0%, 0, 0)");

    vi.useRealTimers();
  });

  it("touch events adjust transform as you move, finalizing on touchEnd", () => {
    const slidesToShow = 2;
    render(<Carousel imageUrls={imageUrls} slidesToShow={slidesToShow} />);

    const container = screen.getByTestId("carousel-container");

    Object.defineProperty(container, "clientWidth", {
      value: 400,
      writable: true,
    });

    fireEvent.touchStart(container, {
      touches: [{ pageX: 200 }],
    });

    fireEvent.touchMove(container, {
      touches: [{ pageX: 180 }],
    });

    fireEvent.touchEnd(container, {
      changedTouches: [{ pageX: 180 }],
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });
    fireEvent.transitionEnd(container);

    expect(container).toHaveStyle("transform: translate3d(-150%, 0, 0)");
  });

  it("shifts indexes and resets transform after transition if out of buffer range", () => {
    const slidesToShow = 2;
    render(<Carousel imageUrls={imageUrls} slidesToShow={slidesToShow} />);

    const container = screen.getByTestId("carousel-container");

    fireEvent.wheel(container, { deltaY: -100 }); // => 1
    act(() => {
      vi.advanceTimersByTime(300);
    });
    fireEvent.transitionEnd(container);

    fireEvent.wheel(container, { deltaY: -100 }); // => 0
    act(() => {
      vi.advanceTimersByTime(300);
    });
    fireEvent.transitionEnd(container);

    expect(container).toHaveStyle("transform: translate3d(-100%, 0, 0)");
  });

  it("arrow keys do not move the carousel", async () => {
    render(<Carousel imageUrls={["img1", "img2", "img3"]} slidesToShow={2} transitionInSeconds={0} />);
  
    const container = screen.getByTestId("carousel-container");
    
    container.focus();
    const initialTransform = container.style.transform;

    fireEvent.keyDown(container, { key: "ArrowLeft" });

    act(() => {
      vi.advanceTimersByTime(1000);
    });
  
    expect(container.style.transform).toBe(initialTransform);
  });

  it("preloads images for new slides but does not duplicate if already cached", async () => {

    const imageSpy = vi.spyOn(window, "Image"); 

    render(<Carousel imageUrls={imageUrls} slidesToShow={1} />);

    expect(imageSpy).toHaveBeenCalled();

    imageSpy.mockClear();

    const firstCarouselSlide = screen
      .getAllByAltText(/carousel-image-/i)[0] as HTMLImageElement;
    fireEvent.load(firstCarouselSlide);

    fireEvent.wheel(screen.getByTestId("carousel-container"), { deltaY: 120 });

    expect(imageSpy).not.toHaveBeenCalled();

    imageSpy.mockRestore();
  });

  it("saves loaded images", () => {
   
    render(
      <Carousel
        imageUrls={imageUrls}
        slidesToShow={2}
      />
    );

    const memoryContainer = screen.getByTestId("renderless-container");
    expect(memoryContainer).toHaveStyle(
      "background-image: url(img4.jpg),url(img5.jpg),url(img6.jpg)"
    );
  });

  it('should preload initial images', async () => {
    const originalCreateElement = document.createElement;
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'img') {
        const img = originalCreateElement.call(document, tagName);
        setTimeout(() => {
          img.dispatchEvent(new Event('load'));
        }, 0);
        return img;
      }
      return originalCreateElement.call(document, tagName);
    });
    
    render(<Carousel imageUrls={imageUrls} slidesToShow={2} />);
    
    await vi.runAllTimers();
    
    const renderlessContainer = screen.getByTestId('renderless-container');
    
    expect(renderlessContainer.style.backgroundImage).toContain('url(http://example.com/image4.jpg)');

  });

  it("updates the order of slides when shifting out of left boundary", () => {

    render(
      <Carousel
        imageUrls={imageUrls}
        slidesToShow={2}
        transitionInSeconds={0.3}
      />
    );
    const firstSlide = screen.getByAltText("carousel-image-0");

    const initialOrder = firstSlide.parentElement
      ? firstSlide.parentElement.style.order
      : "";
 
    expect(initialOrder).toBe("0");
  });

  it("updates the order of slides when shifting out of left boundary", () => {

    render(
      <Carousel
        imageUrls={imageUrls}
        slidesToShow={2}
        transitionInSeconds={0.3}
      />
    );
    const firstSlide = screen.getByAltText("carousel-image-0");

    const initialOrder = firstSlide.parentElement
      ? firstSlide.parentElement.style.order
      : "";

    fireEvent.wheel(screen.getByTestId("carousel-container"), {
      deltaY: 120,
    });

    fireEvent.transitionEnd(screen.getByTestId("carousel-container"));

    const updatedOrder = firstSlide.parentElement
      ? firstSlide.parentElement.style.order
      : "";

    expect(updatedOrder).not.toBe(initialOrder);

 
    expect(updatedOrder).toBe("2");
  });

  it("updates the order of slides when shifting out of left boundary", () => {

    render(
      <Carousel
        imageUrls={imageUrls}
        slidesToShow={2}
        transitionInSeconds={0.3}
      />
    );
    const firstSlide = screen.getByAltText("carousel-image-0");



    fireEvent.wheel(screen.getByTestId("carousel-container"), {
      deltaY: -120,
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    fireEvent.transitionEnd(screen.getByTestId("carousel-container"));

    fireEvent.wheel(screen.getByTestId("carousel-container"), {
      deltaY: -120,
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    fireEvent.transitionEnd(screen.getByTestId("carousel-container"));

    const updatedOrder = firstSlide.parentElement
      ? firstSlide.parentElement.style.order
      : "";
 
    expect(updatedOrder).toBe("4");
  });

});
