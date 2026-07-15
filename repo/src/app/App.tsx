import { RouterProvider } from 'react-router';
import { router } from './routes';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Force dark mode and RTL for Arabic
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');
  }, []);

  return <RouterProvider router={router} />;
}

export default App;