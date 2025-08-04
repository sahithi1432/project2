import { useParams } from 'react-router-dom';

function DebugRoute() {
  const params = useParams();
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Debug Route</h1>
      <p>This page is working! The routing is functioning correctly.</p>
      <h2>URL Parameters:</h2>
      <pre>{JSON.stringify(params, null, 2)}</pre>
      <h2>Current URL:</h2>
      <p>{window.location.href}</p>
    </div>
  );
}

export default DebugRoute; 