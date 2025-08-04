import { altarCategories } from '../assets/altarItems';

// Function to fix image paths from saved altar data
const fixImagePaths = (wallData) => {
  if (!wallData) return wallData;
  
  // Create a mapping of old paths to new imported URLs
  const pathMapping = {
    '/src/assets/defaults/table.png': altarCategories.find(cat => cat.name === 'Tables')?.items[0]?.src,
    '/src/assets/defaults/frame.png': altarCategories.find(cat => cat.name === 'Frames')?.items[0]?.src,
    '/src/assets/defaults/frame4.png': altarCategories.find(cat => cat.name === 'Frames')?.items[1]?.src,
    '/src/assets/defaults/garland1.png': altarCategories.find(cat => cat.name === 'Garlands')?.items[0]?.src,
    '/src/assets/defaults/candle1.png': altarCategories.find(cat => cat.name === 'Candles')?.items[0]?.src,
    '/src/assets/defaults/wall.jpeg': altarCategories.find(cat => cat.name === 'Background')?.items[0]?.src,
    '/src/assets/defaults/wall1.webp': altarCategories.find(cat => cat.name === 'Background')?.items[1]?.src,
    '/src/assets/defaults/wall2.jpg': altarCategories.find(cat => cat.name === 'Background')?.items[2]?.src,
    '/src/assets/defaults/wall3.webp': altarCategories.find(cat => cat.name === 'Background')?.items[3]?.src,
    '/src/assets/defaults/wall4.webp': altarCategories.find(cat => cat.name === 'Background')?.items[4]?.src,
  };

  // Fix wall background
  if (wallData.wallBg && pathMapping[wallData.wallBg]) {
    wallData.wallBg = pathMapping[wallData.wallBg];
  }

  // Fix images
  if (wallData.images) {
    if (Array.isArray(wallData.images)) {
      wallData.images = wallData.images.map(img => ({
        ...img,
        src: pathMapping[img.src] || img.src
      }));
    } else if (typeof wallData.images === 'object') {
      Object.keys(wallData.images).forEach(key => {
        if (wallData.images[key].src && pathMapping[wallData.images[key].src]) {
          wallData.images[key].src = pathMapping[wallData.images[key].src];
        }
      });
    }
  }

  return wallData;
};

function WallPreview({ wallData, width = 160, height = 100 }) {
  if (!wallData) return null;
  
  // Fix image paths for admin preview
  const fixedWallData = fixImagePaths(wallData);
  
  // Scale down to fit preview
  const scaleX = width / (fixedWallData.width || 800);
  const scaleY = height / (fixedWallData.height || 500);

  const previewStyle = {
    width,
    height,
    background: fixedWallData.wallBg ? `url(${fixedWallData.wallBg}) center/cover` : fixedWallData.color || "#eee",
  };

  return (
    <div
      className="wall-preview"
      style={previewStyle}
    >
      {Array.isArray(fixedWallData.images) && fixedWallData.images.map((img, i) =>
        img.src ? (
          <img
            key={i}
            src={img.src}
            alt=""
            className={`wall-preview-img${img.shape === "circle" ? " wall-preview-img-circle" : ""}`}
            style={{
              left: (img.x || 0) * scaleX,
              top: (img.y || 0) * scaleY,
              width: (img.w || 100) * scaleX,
              height: (img.h || 100) * scaleY,
            }}
          />
        ) : null
      )}
    </div>
  );
}

export default WallPreview; 