import { useRef, FC, TouchEvent, WheelEvent, KeyboardEvent } from "react";
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
    const currentPage = useRef<number>(0);
    const leftBufferImageRefs = useRef<(CarouselImageRef | null)[]>([]);
    const visibleImageRefs = useRef<(CarouselImageRef | null)[]>([]);
    const rightBufferImageRefs = useRef<(CarouselImageRef | null)[]>([]);

    const urlCache = useRef<Map<string,number>>(new Map());
    const memoryContainer = useRef<HTMLImageElement | null>(null);

    const widthInPercents = 100 / slidesToShow;
    const transition = `transform ${transitionInSeconds}s ease`;
    const imageUrlsLength = imageUrls.length;
    const slidesCount = slidesToShow * 3;

    const imageOnLoad = (url:string) => {
        if (urlCache.current.has(url)) {
            urlCache.current.set(url, urlCache.current.get(url)! + 1);
            return;
        }
        urlCache.current.set(url, 1);
        if (urlCache.current.size > cacheLimit) {
            const entries = Array.from(urlCache.current.entries());
            entries.sort((a, b) => a[1] - b[1]);
            entries.slice(0, Math.max(0, entries.length - cacheLimit)).forEach(([key]) => {
              urlCache.current.delete(key);
            });
        }
        if (memoryContainer.current) {
            memoryContainer.current.style.backgroundImage = Array.from(urlCache.current.keys()).map(url => `url(${url})`).join(',');
        }
    };

    const preloadImage = (url: string): Promise<void> => {
        return new Promise((resolve) => {
            if (urlCache.current.has(url)) {
                urlCache.current.set(url, urlCache.current.get(url)! + 1);
                resolve();
                return;
            }
            const img = new Image();
            img.onload = () => {
                imageOnLoad(url);
                resolve();
            };
            img.src = url;
        });
    };

    const addIndexesInTheBeginningRemoveFromTheEnd = () => {
        currentPage.current -=1; 

        leftBufferImageRefs.current.forEach((ref, index) => {
            ref?.updateOrder(slidesToShow + index);
        });

        visibleImageRefs.current.forEach((ref, index) => {
            ref?.updateOrder(slidesToShow*2 + index);
        });

        rightBufferImageRefs.current.forEach((ref, index) => {
            ref?.updateOrder(index);
            const val = (currentPage.current * slidesToShow) - slidesToShow + index;
            const imgIndex =  (val % imageUrlsLength + imageUrlsLength) % imageUrlsLength;
            const imageUrl = imageUrls[imgIndex];
            preloadImage(imageUrl);
            ref?.updateSrc(imageUrl);
        });
        
        //rotate refs
        [
            leftBufferImageRefs.current,
            visibleImageRefs.current,
            rightBufferImageRefs.current
        ] = [
            rightBufferImageRefs.current,
            leftBufferImageRefs.current,
            visibleImageRefs.current
        ];

    };

    const addIndexesInTheEndRemoveFromTheBeginning = () => {
        currentPage.current +=1; 

        rightBufferImageRefs.current.forEach((ref, index) => {
            ref?.updateOrder(slidesToShow + index);
        });

        visibleImageRefs.current.forEach((ref, index) => {
            ref?.updateOrder(index);
        });

        leftBufferImageRefs.current.forEach((ref, index) => {
            ref?.updateOrder(2*slidesToShow + index);
            const val = (currentPage.current * slidesToShow) + slidesToShow + index;
            const imgIndex =  (val % imageUrlsLength + imageUrlsLength) % imageUrlsLength;
            ref?.updateSrc(imageUrls[imgIndex]);
        });
        
        //rotate refs
        [
            leftBufferImageRefs.current,
            visibleImageRefs.current,
            rightBufferImageRefs.current
        ] = [
            visibleImageRefs.current,
            rightBufferImageRefs.current,
            leftBufferImageRefs.current,
        ];
    };

    const addAndRemoveIndexes = () => {
        if (currentIndexRef.current < slidesToShow) {
            addIndexesInTheBeginningRemoveFromTheEnd();
        } else {
            addIndexesInTheEndRemoveFromTheBeginning();
        }
        
        currentIndexRef.current += (currentIndexRef.current < slidesToShow ? slidesToShow : -slidesToShow);

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
        const shouldShiftIndexes = currentIndexRef.current < slidesToShow || currentIndexRef.current >=  slidesCount - slidesToShow;
        if (!startXRef.current && shouldShiftIndexes) {
            addAndRemoveIndexes();
        }
    };

    const slides = Array.from({ length: slidesCount }, (_, index) => -slidesToShow + index).map((val,index) => {
        const imgIndex = (val % imageUrlsLength + imageUrlsLength) % imageUrlsLength;
        const imageUrl = imageUrls[imgIndex];
        preloadImage(imageUrl);
        const imagesRef = index < slidesToShow 
            ? leftBufferImageRefs 
            : index < 2*slidesToShow 
                ? visibleImageRefs 
                : rightBufferImageRefs;
        
        return (
        <CarouselImage 
            id={index} 
            ref={(el: CarouselImageRef | null) => (imagesRef.current[index % slidesToShow] = el)}
            key={index} 
            initialSrc={imageUrl}
            widthInPercents={widthInPercents} 
            marginInPercents={marginInPercents}
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
                <RenderLessContainer ref={memoryContainer} data-testid="renderless-container" />
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
    &:focus {
    outline: none;
    }
    &:focus-visible {
      outline: none;
    }
 
`;

// used to keep images in memory
const RenderLessContainer = styled.img`
    position:fixed;
`;