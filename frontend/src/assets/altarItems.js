// Import images for Vite to process them correctly
import tableImg from './defaults/table.png';
import frame1Img from './defaults/frame.png';
import frame2Img from './defaults/frame4.png';
import garland1Img from './defaults/garland1.png';
import candle1Img from './defaults/candle1.png';
import wall1Img from './defaults/wall.jpeg';
import wall2Img from './defaults/wall1.webp';
import wall3Img from './defaults/wall2.jpg';
import wall4Img from './defaults/wall3.webp';
import wall5Img from './defaults/wall4.webp';

// Vite-compatible static URLs for images
export const altarCategories = [
  {
    name: "Tables",
    items: [
      { name: "Table", src: tableImg },
    ]
  },
  {
    name: "Frames",
    items: [
      { name: "Frame 1", src: frame1Img },
      { name: "Frame 2", src: frame2Img },
    ]
  },
  {
    name: "Garlands",
    items: [
      { name: "Garland 1", src: garland1Img },
    ]
  },
  {
    name: "Candles",
    items: [
      { name: "Candle 1", src: candle1Img },
    ]
  },
  {
    name: "Background",
    items: [
      { name: "Wall 1", src: wall1Img },
      { name: "Wall 2", src: wall2Img },
      { name: "Wall 3", src: wall3Img },
      { name: "Wall 4", src: wall4Img },
      { name: "Wall 5", src: wall5Img },
    ]
  },
]; 