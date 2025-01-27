import { FC, useEffect, useState } from "react";
import Carousel from './components/Carousel';
import styled from "styled-components";
interface Image {
  id: number;
  author:  string;
  width:  number;
  height:  number;
  url: string;
  download_url: string;
}

// const IMAGES_COUNT = 3;
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


  if (!imageUrls.length) {
    return <Loading>get images info</Loading>; // get image urls
  }

  return (
    <Wrapper>
      <Carousel 
        imageUrls={imageUrls} 
        slidesToShow={5} 
        marginInPercents={2}
      />
    </Wrapper>
  );
}

export default App;

const Wrapper = styled.div`
  width:100%;
  height:100vh;
`;

const Loading = styled.div`
    width: 100vw;
    height: 100vh;
    background-color: grey;
    text-align: center;
    font-size:32px;
    display: flex;
    justify-content: center;
    align-items: center;
`;
