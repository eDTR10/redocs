import React from 'react'
import ReactDOM from 'react-dom/client'
import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
import './index.css'
import { Suspense, lazy } from "react";

import NotFound from "./screens/notFound";
import Loader from './components/loader/loader.tsx';

const Page1= lazy(() =>
  wait(1300).then(() => import("./screens/page1.tsx"))
);


const Page2= lazy(() =>
  wait(1300).then(() => import("./screens/page2.tsx"))
);

const AdminDashboard= lazy(() =>
  wait(1300).then(() => import("./pages/AdminDashboard.tsx"))
);

const router = createBrowserRouter([
  {
    path: "/redocs/",
    element: <AdminDashboard/>,
    
    children: [
      {
        path: "/redocs/", 
        element: <Navigate to="/redocs/page1" />, 
      },
      {
        path: "/redocs/page1",
        element: <>
        <Suspense fallback={<Loader />}>
          <Page1 />
        </Suspense>
      </>,
      },
      {
        path: "/redocs/page2",
        element: <>
        <Suspense fallback={<Loader />}>
          <Page2 />
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
