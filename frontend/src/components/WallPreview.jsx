function WallPreview({ wallData, width = 160, height = 100 }) {
  if (!wallData) return null;
  // Scale down to fit preview
  const scaleX = width / (wallData.width || 800);
  const scaleY = height / (wallData.height || 500);

  const previewStyle = {
    width,
    height,
    background: wallData.wallBg ? `url(${wallData.wallBg}) center/cover` : wallData.color || "#eee",
  };

  return (
    <div
      className="wall-preview"
      style={previewStyle}
    >
      {Array.isArray(wallData.images) && wallData.images.map((img, i) =>
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