import { FC, useEffect, useState } from "react";
import Carousel from './components/Carousel';
import styled, { keyframes } from "styled-components";
interface Image {
  id: number;
  author:  string;
  width:  number;
  height:  number;
  url: string;
  download_url: string;
}

// const IMAGES_COUNT = 10;
// const IMAGES_COUNT = 100;
// const IMAGES_COUNT = 1000;
// const IMAGES_COUNT = 10000;
const IMAGES_COUNT = 100000;

const App : FC = () => {

  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    getImageUrls();
}, []);

  const getImageUrls = async () => {
    try {
        const response = await fetch(`https://picsum.photos/v2/list?limit=${IMAGES_COUNT}`);
        const data = await response.json() as Image[];
        const urls = data.map(image => image.download_url);
        setImageUrls(urls);
    } catch (error) {
        console.error('Error fetching images:', error);
    }
  };

  return (
    <Wrapper>
      {!imageUrls.length 
      ? <LoaderFix><Loader/></LoaderFix> 
      :  <Carousel 
          imageUrls={imageUrls} 
          slidesToShow={5} 
          marginInPercents={2}
          transitionInSeconds={0.3}
        />}
    </Wrapper>
  );
}

export default App;

const Wrapper = styled.div`
  width:100%;
  height:100vh;
`;

const LoaderFix = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
`;

const spin = keyframes`
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
`;

export const Loader = styled.div`
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
