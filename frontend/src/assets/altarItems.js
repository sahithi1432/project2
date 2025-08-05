// Import images for Vite to process them correctly
// Updated for production deployment - ensure proper image loading
import tableImg from './defaults/table.png';
import table1Img from './defaults/table1.png';
import table2Img from './defaults/table2.png';
import table3Img from './defaults/table3.png';
import frame1Img from './defaults/frame.png';
import frame2Img from './defaults/frame4.png';
import frame9Img from './defaults/frame9.png';
import frame21Img from './defaults/frame21.png';
import frame31Img from './defaults/frame31.png';
import garland1Img from './defaults/garland1.png';
import garland3Img from './defaults/garland3.png';
import garland4Img from './defaults/garland4.png';
import garland5Img from './defaults/garland5.png';
import garland6Img from './defaults/garland6.png';
import garland11Img from './defaults/garland11.png';
import garland21Img from './defaults/garland21.png';
import wallgarlandImg from './defaults/wallgarland.png';
import wallgarland1Img from './defaults/wallgarland1.png';
import wallgarland2Img from './defaults/wallgarland2.png';
import candle1Img from './defaults/candle1.png';
import candle3Img from './defaults/candle3.png';
import candle4Img from './defaults/candle4.png';
import candle5Img from './defaults/candle5.png';
import candle9Img from './defaults/candle9.png';
import candlesImg from './defaults/candles.png';
import bouquetImg from './defaults/bouquet.png';
import bouquet1Img from './defaults/bouquet1.png';
import bouquet2Img from './defaults/bouquet2.png';
import bouquet3Img from './defaults/bouquet3.png';
import fruitsImg from './defaults/fruits.png';
import fruits1Img from './defaults/fruits1.png';
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
      { name: "Table 1", src: table1Img },
      { name: "Table 2", src: table2Img },
      { name: "Table 3", src: table3Img },
    ]
  },
  {
    name: "Frames",
    items: [
      { name: "Frame 1", src: frame1Img },
      { name: "Frame 2", src: frame2Img },
      { name: "Frame 9", src: frame9Img },
      { name: "Frame 21", src: frame21Img },
      { name: "Frame 31", src: frame31Img },
    ]
  },
  {
    name: "Garlands",
    items: [
      { name: "Garland 1", src: garland1Img },
      { name: "Garland 3", src: garland3Img },
      { name: "Garland 4", src: garland4Img },
      { name: "Garland 5", src: garland5Img },
      { name: "Garland 6", src: garland6Img },
      { name: "Garland 11", src: garland11Img },
      { name: "Garland 21", src: garland21Img },
    ]
  },
  {
    name: "Wall Garlands",
    items: [
      { name: "Wall Garland", src: wallgarlandImg },
      { name: "Wall Garland 1", src: wallgarland1Img },
      { name: "Wall Garland 2", src: wallgarland2Img },
    ]
  },
  {
    name: "Candles",
    items: [
      { name: "Candle 1", src: candle1Img },
      { name: "Candle 3", src: candle3Img },
      { name: "Candle 4", src: candle4Img },
      { name: "Candle 5", src: candle5Img },
      { name: "Candle 9", src: candle9Img },
      { name: "Candles", src: candlesImg },
    ]
  },
  {
    name: "Flowers",
    items: [
      { name: "Bouquet", src: bouquetImg },
      { name: "Bouquet 1", src: bouquet1Img },
      { name: "Bouquet 2", src: bouquet2Img },
      { name: "Bouquet 3", src: bouquet3Img },
    ]
  },
  {
    name: "Fruits",
    items: [
      { name: "Fruits", src: fruitsImg },
      { name: "Fruits 1", src: fruits1Img },
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