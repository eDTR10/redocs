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


const Page2= lazy(() =>
  wait(1300).then(() => import("./screens/page2.tsx"))
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
    path: "/redocs",
    element: <>
        <Suspense fallback={<Loader />}>
          <Login />
        </Suspense>
      </>,
  },
  {
    path: "/redocs/user",
    element: <UserMainContainer/>,
    
    children: []
  },
  {
    path: "/redocs/admin",
    element: <AdminDashboard/>,
    
    children: [
      {
        path: "/redocs/admin", 
        element: <Navigate to="/redocs/admin/user" />, 
      },
      {
        path: "/redocs/admin/user",
        element: <>
        <Suspense fallback={<Loader />}>
          <Page1 />
        </Suspense>
      </>,
      },



      {
        path: "*",
        element: <NotFound />,
      },
    ],
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
