import { useRef, useState, useCallback, useMemo, FC, TouchEvent, WheelEvent, KeyboardEvent, useLayoutEffect } from "react";
import styled from "styled-components";
import { preloadImages } from "../utils/helpers";
import CarouselImage from './CarouselImage';

interface Props {
    imageUrls: string[];
    slidesToShow: number;
    marginInPercents?: number;
}

const Carousel : FC<Props> = ({imageUrls, slidesToShow, marginInPercents=0}) => {
    const carouselRef = useRef<HTMLDivElement | null>(null);
    const startXRef = useRef<number>(0);
    const touchStartIndexRef = useRef<number>(0);
    const currentIndexRef = useRef<number>(slidesToShow);
    const [imageIndexes, setImageIndexes] = useState<number[]>(Array.from({ length: slidesToShow*3 }, (_, index) => -slidesToShow + index));

    const widthInPercents = useMemo(()=> 100 / slidesToShow, [slidesToShow]);
    const transition = `transform 0.3s ease`;

    useLayoutEffect(()=>{
        if (carouselRef.current) {
            carouselRef.current.style.transition = "none";
            carouselRef.current.style.transform = `translate3d(-${currentIndexRef.current * widthInPercents}%, 0, 0)`;
        }
    },[imageIndexes, widthInPercents]);

    const preloadChunkOfImages = (index: number[]) => {
        const urls = index.map((val) => imageUrls[(val % imageUrls.length + imageUrls.length) % imageUrls.length]);
        preloadImages(urls);
    };

    const addIndexesInTheBeginningRemoveFromTheEnd = () => {
        const indexesToAdd = Array.from({ length: slidesToShow }, (_, i) => imageIndexes[0] - (i + 1));
        preloadChunkOfImages(indexesToAdd);
        const indexesWithRemovedEnd = imageIndexes.slice(0, -slidesToShow);
        return [...indexesToAdd.reverse(), ...indexesWithRemovedEnd]
    };

    const addIndexesInTheEndRemoveFromTheBeginning = () => {
        const indexesToAdd = Array.from({ length: slidesToShow }, (_, i) => imageIndexes[imageIndexes.length - 1] + (i + 1));
        preloadChunkOfImages(indexesToAdd);
        const indexesWithRemovedStart = imageIndexes.slice(slidesToShow);
        return [...indexesWithRemovedStart, ...indexesToAdd]
    };

    const addAndRemoveIndexes = () => {
        const newImageIndexes = currentIndexRef.current < slidesToShow 
                    ? addIndexesInTheBeginningRemoveFromTheEnd()
                    : addIndexesInTheEndRemoveFromTheBeginning();
        
        setImageIndexes(newImageIndexes);

        currentIndexRef.current = currentIndexRef.current + (currentIndexRef.current < slidesToShow ? slidesToShow : -slidesToShow);
    };

    const moveToNextSlide = useCallback((delta:number) => {
        if (currentIndexRef.current % 1 !== 0) {
            currentIndexRef.current = delta < 0 ? Math.ceil(currentIndexRef.current) : Math.floor(currentIndexRef.current);
        } else {
            currentIndexRef.current = currentIndexRef.current + (delta < 0 ? 1 : -1);
        }
        if (carouselRef.current) {
            carouselRef.current.style.transition = transition;
            carouselRef.current.style.transform = `translate3d(-${
              currentIndexRef.current * widthInPercents
            }%, 0, 0)`;
        }

        startXRef.current = 0;
    },[widthInPercents, transition]);

    const onWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
        moveToNextSlide(event.deltaY);
    },[moveToNextSlide]);

    const onTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
        startXRef.current = event.touches[0].pageX;
        touchStartIndexRef.current = currentIndexRef.current;
    },[]);

    const onTouchMove = useCallback((event: TouchEvent<HTMLDivElement>) => {
        if (!carouselRef.current) return;
        const x = event.touches[0].pageX;
        const walk = x - startXRef.current;
        const percentageWalk = (walk / carouselRef.current.clientWidth);
        currentIndexRef.current = touchStartIndexRef.current - percentageWalk * slidesToShow;
        carouselRef.current.style.transform = `translate3d(-${(currentIndexRef.current * widthInPercents)}%, 0, 0)`;
    }, [slidesToShow, widthInPercents]);

    const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
        const endX = event.changedTouches[0].pageX;
        const deltaX = endX - startXRef.current;

        if (deltaX) {
            moveToNextSlide(deltaX);
        }
        
    };

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const onTransitionEnd = () => {
        const shouldShiftIndexes = currentIndexRef.current < slidesToShow || currentIndexRef.current >=  imageIndexes.length - slidesToShow;
        if (!startXRef.current && shouldShiftIndexes) {
            addAndRemoveIndexes();
        }
    };

    const slides = useMemo(() => imageIndexes.map((val) => {
        const imgIndex = (val % imageUrls.length + imageUrls.length) % imageUrls.length;
        const imageUrl = imageUrls[imgIndex];
        return (
        <CarouselImage 
            id={imgIndex} 
            key={imgIndex} 
            imageUrl={imageUrl} 
            widthInPercents={widthInPercents} 
            marginInPercents={marginInPercents}
        />);
    }), [imageIndexes, imageUrls, widthInPercents, marginInPercents]);


    return (
        <CarouselWrapper>
            <CarouselContainer
                data-testid="carousel-container"
                ref={carouselRef}
                tabIndex={0}
                onWheel={onWheel}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onKeyDown={onKeyDown}
                style={{ transform: `translate3d(-${currentIndexRef.current*widthInPercents}%, 0, 0)`, transition }}
                onTransitionEnd={onTransitionEnd}
            >
                {slides}
            </CarouselContainer>
        </CarouselWrapper>
    );
};

export default Carousel;

const CarouselWrapper = styled.div`
    width: 100%;
    height: 100%;
    overflow: hidden;
`;

const CarouselContainer = styled.div`
    width: 100%;
    height: 100%;
    touch-action: none;
    display: flex;
    flex-wrap: no-wrap;
    align-items: center;
`;

