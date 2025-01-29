import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";

interface Props {
    id:number;
    initialSrc:string;
    intialOrder:number;
    widthInPercents: number;
    marginInPercents: number;
    onLoad?: (src:string) => void;
}

export interface CarouselImageRef {
  updateSrc: (newSrc: string) => void;
  updateOrder: (newOrder: number) => void;
}

const CarouselImage = forwardRef<CarouselImageRef, Props>(
  ({ id, initialSrc, widthInPercents, marginInPercents, onLoad }, ref) => {

    const [isLoaded, setIsLoaded] = useState(false);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    const hideLoader = () => {
      setIsLoaded(true);
    };

    useImperativeHandle(ref, () => ({
      updateSrc: (newSrc: string) => {
        if (imageRef.current) {
            imageRef.current.src = newSrc;
        }
      },
      updateOrder: (newOrder: number) => {
        if (wrapperRef.current) {
            wrapperRef.current.style.order = newOrder+'';
        }
      },
    }));

    const onLoaded = () => {
      if (imageRef.current) {
        onLoad?.(imageRef.current.src);
        imageRef.current.style.transition = "opacity 0.2s ease;";
        imageRef.current.style.opacity = "1";
      }
    }

    const handleError = () => { //retry
      imageRef.current?.setAttribute("src", `${initialSrc}?retry=${id}`);
    };

    return (
        <Wrapper 
            ref={wrapperRef}
            $widthInPercents={widthInPercents}
            $marginInPercents={marginInPercents}
            style={{order: id}}
        >
            { !isLoaded && <Loader /> }
            <Image
                ref={imageRef}
                src={initialSrc}
                alt={`carousel-image-${id}`}
                onLoad={onLoaded}
                onError={handleError}
                onTransitionEnd={hideLoader}
                decoding={"async"}
            />

        </Wrapper>
    );
});

export default CarouselImage;

const Wrapper = styled.div.attrs<{  $widthInPercents: number; $marginInPercents: number}>(
  ({  $widthInPercents, $marginInPercents }) => ({
    style: {
      minWidth: `${$widthInPercents - 2 * $marginInPercents}%`,
      margin: `${$marginInPercents}%`,
    },
  })
)`
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Image = styled.img`
  height: 100%;
  width: 100%;
  background-repeat: no-repeat;
  background-position: center center;
  object-fit: contain;
  z-index:1;
  opacity: 0;
`;

const spin = keyframes`
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
`;

const Loader = styled.div`
  position: absolute;
  width:30px;
  height:30px;

  font-size: 16px;
  font-weight: bold;
  animation: ${spin} 1s linear infinite;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
`;