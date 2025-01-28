type Procedure<T = unknown> = (...args: T[]) => void;

export const debounce = <T extends Procedure>(func: T, delay: number): T => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return function (...args) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    } as T;
  };

type ThrottleCallback<T extends unknown[]> = (...args: T) => void;

export const throttle = <T extends unknown[]>(func:ThrottleCallback<T>, delay:number) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let shouldWait = false;
    return (...args:T) => {
        if (shouldWait) return;
        func(...args)
        shouldWait = true;
        if (timer) {
            clearTimeout(timer);
        }

        timer = setTimeout(()=> {
            shouldWait = false;
        }, delay);
    }
};

export const loadImage = (url: string, callback?: (img: HTMLImageElement) => void) => {
  return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
          if (callback) {
              callback(img);
          }
          resolve(img);
      };
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
  });
};

export const preloadImages = (urls: string[], callback?: (img: HTMLImageElement) => void) => {
  const imagePromises = urls.map(url => loadImage(url, callback));
  return Promise.all(imagePromises);
};