import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '@/layouts/RootLayout';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import SignIn from '@/pages/SignIn';
import NotFound from '@/pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'login', element: <Login /> },
      { path: 'signin', element: <SignIn /> },
      { path: 'dashboard', element: <div>Admin Dashboard</div> },
      { path: 'users', element: <div>Admin Users</div> },
      { path: 'settings', element: <div>Admin Settings</div> },
      { path: 'organize/events', element: <div>Organizer Events</div> },
      { path: 'organize/manage', element: <div>Organizer Manage</div> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
