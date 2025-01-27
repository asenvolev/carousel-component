export const loadImage = (url:string) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
    });
};

export const preloadImages = (urls:string[]) => {
    const imagePromises = urls.map(url => loadImage(url));
    return Promise.all(imagePromises);
};