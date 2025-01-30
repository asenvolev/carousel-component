// CarouselImage.test.tsx
import { useEffect, useRef } from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CarouselImage, { CarouselImageRef } from "./CarouselImage";

describe("CarouselImage Component", () => {
  const baseProps = {
    id: 0,
    initialSrc: "http://example.com/test.jpg",
    intialOrder: 5,
    widthInPercents: 50,
    marginInPercents: 0,
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("renders an <img> and displays a loader initially", () => {
    render(<CarouselImage {...baseProps} />);
    const img = screen.getByRole("img", { name: /carousel-image-0/i });
    expect(img).toBeInTheDocument();

    const loader = screen.getByTestId("loader");

    expect(loader).toBeInTheDocument();
  });

  it("renders the image with correct src and alt", () => {
    render(
      <CarouselImage
        id={1}
        initialSrc="test-image.jpg"
        widthInPercents={50}
        marginInPercents={5}
      />
    );

    const img = screen.getByAltText("carousel-image-1") as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toContain("test-image.jpg");
  });

  it("sets the wrapper style correctly for width and margin", () => {
    render(
      <CarouselImage
        id={10}
        initialSrc="another.jpg"
        widthInPercents={60}
        marginInPercents={10}
      />
    );

    const wrapper = screen.getByAltText("carousel-image-10").parentElement;

    expect(wrapper).toBeInTheDocument();
    if (wrapper) {
      expect(wrapper).toHaveStyle("min-width: 40%");
      expect(wrapper).toHaveStyle("margin: 10%");
      expect(wrapper).toHaveStyle("order: 10");
    }
  });

  it("calls onLoad after the image loads and hides the loader on transition end", () => {
    const onLoadMock = vi.fn();
    render(<CarouselImage {...baseProps} onLoad={onLoadMock} />);

    const img = screen.getByRole("img", { name: /carousel-image-0/i });
    fireEvent.load(img);
    expect(onLoadMock).toHaveBeenCalledWith(baseProps.initialSrc);

    // the image transitions to opacity=1, then calls onTransitionEnd to hide the loader
    fireEvent.transitionEnd(img);
    const loader = screen.queryByTestId("loader");
    expect(loader).not.toBeInTheDocument();
  });

  it("calls onLoad with the updated src when the image is loaded", () => {
    const onLoadMock = vi.fn();
    const testSrc = "onload-test.jpg";

    render(
      <CarouselImage
        id={3}
        initialSrc={testSrc}
        widthInPercents={50}
        marginInPercents={5}
        onLoad={onLoadMock}
      />
    );

    const img = screen.getByAltText("carousel-image-3") as HTMLImageElement;
    fireEvent.load(img);

    // The onLoad callback should be called with the final image src
    expect(onLoadMock).toHaveBeenCalledTimes(1);
    expect(onLoadMock).toHaveBeenCalledWith(expect.stringContaining(testSrc));

    // We can also check that the image's style got updated
    expect(img).toHaveStyle("opacity: 1");
  });

  it("retries loading with ?retry=id on error", () => {
    render(<CarouselImage {...baseProps} />);
    const img = screen.getByRole("img", { name: /carousel-image-0/i });
    fireEvent.error(img);

    expect(img).toHaveAttribute("src", "http://example.com/test.jpg?retry=0");
  });

  it("can update the image src using the ref's updateSrc method", async () => {
    function TestComponent() {
      const carouselImageRef = useRef<CarouselImageRef>(null);

      useEffect(() => {
        carouselImageRef.current?.updateSrc("new-image.jpg");
      }, []);

      return (
        <CarouselImage
          {...baseProps}
          ref={carouselImageRef}
        />
      );
    }

    render(<TestComponent />);

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "new-image.jpg");

  });

  it("update the image and expect loader is not in the dom", async () => {
    function TestComponent() {
      const carouselImageRef = useRef<CarouselImageRef>(null);

      useEffect(() => {
        carouselImageRef.current?.updateSrc("new-image.jpg");
      }, []);

      return (
        <CarouselImage
          {...baseProps}
          ref={carouselImageRef}
        />
      );
    }

    render(<TestComponent />);
    const img = screen.getByRole("img", { name: /carousel-image-0/i });
    fireEvent.load(img);
    fireEvent.transitionEnd(img);

    const loader = screen.queryByTestId("loader");
    expect(loader).not.toBeInTheDocument();

  });

  it("can update the wrapper order using the ref's updateOrder method", () => {
    let testRef: CarouselImageRef | null = null as CarouselImageRef | null;
    function TestComponent() {
      const carouselImageRef = useRef<CarouselImageRef>(null);

      useEffect(() => {
        testRef = carouselImageRef.current;
      }, []);

      return (
        <CarouselImage
          {...baseProps}
          ref={carouselImageRef}
        />
      );
    }

    render(<TestComponent />);

    const img = screen.getByRole("img", { name: /carousel-image-0/i });
    const wrapper = img.parentElement as HTMLDivElement;

    expect(wrapper).toHaveStyle("order: 0");

    // Now update the order to 10
    if (testRef) {
      testRef.updateOrder(10);
    }
    expect(wrapper).toHaveStyle("order: 10");
  });
});
