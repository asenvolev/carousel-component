import { useRef, FC, TouchEvent, WheelEvent, KeyboardEvent, useMemo, useCallback } from "react";
import styled from "styled-components";
import { throttle } from "../utils/helpers";
import CarouselImage, { CarouselImageRef } from './CarouselImage';

interface Props {
    imageUrls: string[];
    slidesToShow: number;
    marginInPercents?: number;
    transitionInSeconds?: number;
    cacheLimit?: number;
}

export interface CacheEntry {
    image: HTMLImageElement;
    isLoaded: boolean;
}

const Carousel : FC<Props> = ({imageUrls, slidesToShow, marginInPercents=0, transitionInSeconds=0.3, cacheLimit=slidesToShow*6}) => {
    const carouselRef = useRef<HTMLDivElement | null>(null);
    const startXRef = useRef<number>(0);
    const touchStartIndexRef = useRef<number>(0);
    const currentIndexRef = useRef<number>(slidesToShow);
    const imageIndexesRef = useRef<number[]>(Array.from({ length: slidesToShow*3 }, (_, index) => -slidesToShow + index)); // 3 times the slidesToShow cause we need buffer for touch events
    const imageRefs = useRef<(CarouselImageRef | null)[]>([]);
    const imageCache = useRef<Map<string, CacheEntry>>(new Map());

    const widthInPercents = 100 / slidesToShow;
    const transition = `transform ${transitionInSeconds}s ease`;
    const imageUrlsLength = imageUrls.length;

    const imageOnLoad = (img: HTMLImageElement) => {
        imageCache.current.set(img.src, { image: img, isLoaded: true });
        if (imageCache.current.size > cacheLimit) {
            const firstKey = imageCache.current.keys().next().value;
            if (firstKey !== undefined) {
                imageCache.current.delete(firstKey);
            }
        }
    };

    const preloadImage = (url: string): Promise<void> => {
        return new Promise((resolve) => {
            if (imageCache.current.has(url)) {
                resolve();
                return;
            }
            const img = new Image();
            img.onload = () => {
                imageOnLoad(img);
                resolve();
            };
            img.src = url;
        });
    };

    const preloadChunkOfImages = (indexes: number[]) => {
        indexes.map(
            (val) => preloadImage(imageUrls[(val % imageUrlsLength + imageUrlsLength) % imageUrlsLength])
        );
    };

    const addIndexesInTheBeginningRemoveFromTheEnd = () => {
        const indexesToAdd = Array.from({ length: slidesToShow }, (_, i) => imageIndexesRef.current[0] - (i + 1));
        preloadChunkOfImages(indexesToAdd);
        const indexesWithRemovedEnd = imageIndexesRef.current.slice(0, -slidesToShow);
        return [...indexesToAdd.reverse(), ...indexesWithRemovedEnd]
    };

    const addIndexesInTheEndRemoveFromTheBeginning = () => {
        const indexesToAdd = Array.from({ length: slidesToShow }, (_, i) => imageIndexesRef.current[imageIndexesRef.current.length - 1] + (i + 1));
        preloadChunkOfImages(indexesToAdd);
        const indexesWithRemovedStart = imageIndexesRef.current.slice(slidesToShow);
        return [...indexesWithRemovedStart, ...indexesToAdd]
    };

    const addAndRemoveIndexes = () => {
        const newImageIndexes = currentIndexRef.current < slidesToShow 
                    ? addIndexesInTheBeginningRemoveFromTheEnd()
                    : addIndexesInTheEndRemoveFromTheBeginning();
        
        imageIndexesRef.current = newImageIndexes;

        currentIndexRef.current += (currentIndexRef.current < slidesToShow ? slidesToShow : -slidesToShow);

        imageRefs.current.forEach((ref, index) => {
            const newSource = imageUrls[(newImageIndexes[index] % imageUrlsLength + imageUrlsLength) % imageUrlsLength]
            ref?.updateSrc(newSource, imageCache.current.get(newSource)?.isLoaded || false);
        });

        if (carouselRef.current) {
            carouselRef.current.style.transition = "none";
            carouselRef.current.style.transform = `translate3d(-${currentIndexRef.current * widthInPercents}%, 0, 0)`;
        }
        
    };

    const moveToNextSlide = (delta:number) => {
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
    };

    const onWheel = (event: WheelEvent<HTMLDivElement>) => {
        moveToNextSlide(event.deltaY);
    };

    const throttledOnWheel = throttle(onWheel, transitionInSeconds * 1000);

    const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
        startXRef.current = event.touches[0].pageX;
        touchStartIndexRef.current = currentIndexRef.current;
    };

    const onTouchMove = (event: TouchEvent<HTMLDivElement>) => {
        if (!carouselRef.current) return;
        const x = event.touches[0].pageX;
        const walk = x - startXRef.current;
        const percentageWalk = (walk / carouselRef.current.clientWidth);
        currentIndexRef.current = touchStartIndexRef.current - percentageWalk * slidesToShow;
        carouselRef.current.style.transform = `translate3d(-${(currentIndexRef.current * widthInPercents)}%, 0, 0)`;
    };

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
        const shouldShiftIndexes = currentIndexRef.current < slidesToShow || currentIndexRef.current >=  imageIndexesRef.current.length - slidesToShow;
        if (!startXRef.current && shouldShiftIndexes) {
            addAndRemoveIndexes();
        }
    };

    const slides = imageIndexesRef.current.map((val,index) => {
        const imgIndex = (val % imageUrlsLength + imageUrlsLength) % imageUrlsLength;
        const imageUrl = imageUrls[imgIndex];
        return (
        <CarouselImage 
            id={imgIndex} 
            ref={(el: CarouselImageRef | null) => (imageRefs.current[index] = el)}
            key={index} 
            initialSrc={imageUrl} 
            widthInPercents={widthInPercents} 
            marginInPercents={marginInPercents}
            onLoad={imageOnLoad}
        />);
    });


    return (
        <CarouselWrapper>
            <CarouselContainer
                data-testid="carousel-container"
                ref={carouselRef}
                tabIndex={0}
                onWheel={throttledOnWheel}
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

