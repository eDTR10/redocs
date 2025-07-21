import React from 'react'
import ReactDOM from 'react-dom/client'
import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";

import './index.css'
import { Suspense, lazy } from "react";

import NotFound from "./screens/notFound";
import Loader from './components/loader/loader.tsx';
import UserDashboard from './pages/User/Dashboard/UserDashboard.tsx';
import LoaderPage from './components/loader/loaderPage.tsx';

const UserManage = lazy(() =>
  wait(1300).then(() => import("./pages/Admin/UserManagement.tsx"))
);

const Page2 = lazy(() =>
  wait(1300).then(() => import("./screens/page2.tsx"))
);

const AdminDashboard = lazy(() =>
  wait(1300).then(() => import("./pages/Admin/AdminDashboard.tsx"))
);

const UserMainContainer = lazy(() =>
  wait(1300).then(() => import("./pages/User/UserMainContainer.tsx"))
);

const DocumentManage = lazy(() =>
  wait(1300).then(() => import("./pages/Admin/DocumentManage.tsx"))
);

const FormFiller = lazy(() =>
  wait(1300).then(() => import("./pages/Admin/ReadDocument.tsx"))
);





const Login = lazy(() =>
  wait(1300).then(() => import("./pages/Auth/Login.tsx"))
);

const CreateDocument = lazy(() =>
  wait(1300).then(() => import("./pages/User/DocumentManagement/CreateDocument/CreateDocument.tsx"))
);



const DocumentTrack = lazy(() =>
  wait(1300).then(() => import("./pages/User/DocumentManagement/DocumentTrack/DocumentTrack.tsx"))
);

const Settings = lazy(() =>
  wait(1300).then(() => import("./pages/User/Settings/Settings.tsx"))
);

const MyDocuments = lazy(() =>
  wait(1300).then(() => import("./pages/User/DocumentManagement/MyDocuments/MyDocuments.tsx"))
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
    element: <UserMainContainer />,
    children: [
      {
        path: "/redocs/user",
        element: <Navigate to="/redocs/user/dashboard" />,
      },
      {
        path: "/redocs/user/dashboard",
        element: <UserDashboard />,
      },
      {
        path: "/redocs/user/documents",
        element: <>
          <Suspense fallback={<Loader />}>
            <MyDocuments />
          </Suspense>
        </>,
      },
      {
        path: "/redocs/user/documents/create",
        element: <>
          <Suspense fallback={<Loader />}>
            <CreateDocument />
          </Suspense>
        </>,
      },
      {
        path: "/redocs/user/documents/track",
        element: <>
          <Suspense fallback={<Loader />}>
            <DocumentTrack />
          </Suspense>
        </>,
      },
      {
        path: "/redocs/user/settings",
        element: <>
          <Suspense fallback={<Loader />}>
            <Settings />
          </Suspense>
        </>,
      },
      {
        path: "/redocs/user/page2",
        element: <Page2 />,
      },
    ]
  },
  {
    path: "/redocs/admin",
    element: <AdminDashboard />,
    children: [
      {
        path: "/redocs/admin",
        element: <Navigate to="/redocs/admin/user" />,
      },
      {
        path: "/redocs/admin/user",
        element: <>
          <Suspense fallback={<LoaderPage />}>
            <UserManage />
          </Suspense>
        </>,
      }

      ,
      {
        path: "/redocs/admin/document",
        element: <>
          <Suspense fallback={<LoaderPage />}>
            <DocumentManage />
          </Suspense>
        </>,
      },

      {
        path: "/redocs/admin/test",
        element: <>
          <Suspense fallback={<LoaderPage />}>
            <FormFiller />
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

function wait(time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
