import { useParams, Navigate } from 'react-router-dom';

function SharedEditRedirect() {
  const { editToken } = useParams();
  
  // Redirect to home page with editToken as query parameter
  return <Navigate to={`/?editToken=${editToken}`} replace />;
}

export default SharedEditRedirect;
