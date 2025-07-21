import React from 'react'
import ReactDOM from 'react-dom/client'
import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";

import './index.css'
import { Suspense, lazy } from "react";

import NotFound from "./screens/notFound";
import Loader from './components/loader/loader.tsx';


const Page1= lazy(() =>
  wait(1300).then(() => import("./pages/Admin/UserManagement.tsx"))
);


// const Page2= lazy(() =>
//   wait(1300).then(() => import("./screens/page2.tsx"))
// );

const AdminPerRole= lazy(() =>
  wait(1300).then(() => import("./components/adminPerRole/Cards.tsx"))
);

const AdminDocument= lazy(() =>
  wait(1300).then(() => import("./components/adminPerRole/Document.tsx"))
);

const Dashboard= lazy(() =>
  wait(1300).then(() => import("./pages/AdminPerRole/Dashboard.tsx"))
);

const AdminDashboard= lazy(() =>
  wait(1300).then(() => import("./pages/Admin/AdminDashboard.tsx"))
);


const UserMainContainer = lazy(() =>
  wait(1300).then(() => import("./pages/User/UserMainContainer.tsx"))
);
const Login= lazy(() =>
  wait(1300).then(() => import("./pages/Auth/Login.tsx"))
);
const router = createBrowserRouter([
  {
    path: '/redocs',
    element: (
      <Suspense fallback={<Loader />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: '/redocs/user',
    element: (
      <Suspense fallback={<Loader />}>
        <UserMainContainer />
      </Suspense>
    ),
    children: [
      // Add user-specific child routes here if needed
    ],
  },
  {
    path: '/redocs/admin',
    element: (
      <Suspense fallback={<Loader />}>
        <AdminDashboard />
      </Suspense>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/redocs/admin/user" replace />,
      },
      {
        path: 'user',
        element: (
          <Suspense fallback={<Loader />}>
            <Page1 />
          </Suspense>
        ),
      },
      // Add more admin child routes here if needed
    ],
  },
  {
    path: '/redocs/adminRole',
    element: (
      <Suspense fallback={<Loader />}>
        <Dashboard />
      </Suspense>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/redocs/adminRole/dashboard" replace />,
      },
      {
        path: '/redocs/adminRole/dashboard',
        element: (
          <Suspense fallback={<Loader />}>
            <AdminPerRole />
          </Suspense>
        ),
      },
      {
        path: '/redocs/adminRole/documents',
        element: (
          <Suspense fallback={<Loader />}>
            <AdminDocument />
          </Suspense>
        ),
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

function wait( time:number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
