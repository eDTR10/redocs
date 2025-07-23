import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";

import './index.css';
import NotFound from "./screens/notFound";
import Loader from './components/loader/loader.tsx';
import LoaderPage from './components/loader/loaderPage.tsx';
import UserDashboard from './pages/User/Dashboard/UserDashboard.tsx';

// Lazy imports with artificial delay
function wait(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

// const Page1 = lazy(() => 
//   wait(1300).then(() => import("./pages/Admin/UserManagement.tsx")
// ));

const AdminPerRole = lazy(() => 
  wait(1300).then(() => import("./components/adminPerRole/dashboard/Cards.tsx")
));

const Tracking = lazy(() => 
  wait(1300).then(() => import("./components/adminPerRole/tracking/Tracking.tsx")
));

const AdminDocument = lazy(() => 
  wait(1300).then(() => import("./components/adminPerRole/documents/Document.tsx")
));

const Dashboard = lazy(() => 
  wait(1300).then(() => import("./pages/AdminPerRole/Dashboard.tsx")
));

const UserManage = lazy(() => 
  wait(1300).then(() => import("./pages/Admin/UserManagement.tsx")
));

const Page2 = lazy(() => 
  wait(1300).then(() => import("./screens/page2.tsx")
));

const AdminDashboard = lazy(() => 
  wait(1300).then(() => import("./pages/Admin/AdminDashboard.tsx")
));

const UserMainContainer = lazy(() => 
  wait(1300).then(() => import("./pages/User/UserMainContainer.tsx")
));

const DocumentManage = lazy(() => 
  wait(1300).then(() => import("./pages/Admin/DocumentManage.tsx")
));

const FormFiller = lazy(() => 
  wait(1300).then(() => import("./pages/Admin/ReadDocument.tsx")
));
const Login = lazy(() => 
  wait(1300).then(() => import("./pages/Auth/Login.tsx")
));

const CreateDocument = lazy(() => 
  wait(1300).then(() => import("./pages/User/DocumentManagement/CreateDocument/CreateDocument.tsx")
));

const DocumentTrack = lazy(() => 
  wait(1300).then(() => import("./pages/User/DocumentManagement/DocumentTrack/DocumentTrack.tsx")
));

const Settings = lazy(() => 
  wait(1300).then(() => import("./pages/User/Settings/Settings.tsx")
));

const MyDocuments = lazy(() => 
  wait(1300).then(() => import("./pages/User/DocumentManagement/MyDocuments/MyDocuments.tsx")
));

const router = createBrowserRouter([
  // Login route
  {
    path: '/redocs',
    element: (
      <Suspense fallback={<Loader />}>
        <Login />
      </Suspense>
    ),
  },
  // User routes
  {
    path: '/redocs/user',
    element: (
      <Suspense fallback={<Loader />}>
        <UserMainContainer />
      </Suspense>
    ),
    children: [
      { index: true, element: <Navigate to="/redocs/user/dashboard" replace /> },
      {
        path: "dashboard",
        element: <UserDashboard />,
      },
      {
        path: "documents",
        element: (
          <Suspense fallback={<Loader />}>
            <MyDocuments />
          </Suspense>
        ),
      },
      {
        path: "documents/create",
        element: (
          <Suspense fallback={<Loader />}>
            <CreateDocument />
          </Suspense>
        ),
      },
      {
        path: "documents/track",
        element: (
          <Suspense fallback={<Loader />}>
            <DocumentTrack />
          </Suspense>
        ),
      },
      {
        path: "settings",
        element: (
          <Suspense fallback={<Loader />}>
            <Settings />
          </Suspense>
        ),
      },
      {
        path: "page2",
        element: (
          <Suspense fallback={<Loader />}>
            <Page2 />
          </Suspense>
        ),
      },
    ],
  },
  // Admin routes
  {
    path: '/redocs/admin',
    element: (
      <Suspense fallback={<Loader />}>
        <AdminDashboard />
      </Suspense>
    ),
    children: [
      { index: true, element: <Navigate to="/redocs/admin/user" replace /> },
      {
        path: "user",
        element: (
          <Suspense fallback={<LoaderPage />}>
            <UserManage />
          </Suspense>
        ),
      },
      {
        path: "document",
        element: (
          <Suspense fallback={<LoaderPage />}>
            <DocumentManage />
          </Suspense>
        ),
      },
      {
        path: "test",
        element: (
          <Suspense fallback={<LoaderPage />}>
            <FormFiller />
          </Suspense>
        ),
      },
    ],
  },
  // AdminPerRole routes
  {
    path: '/redocs/adminRole',
    element: (
      <Suspense fallback={<Loader />}>
        <Dashboard />
      </Suspense>
    ),
    children: [
      { index: true, element: <Navigate to="/redocs/adminRole/dashboard" replace /> },
      {
        path: "dashboard",
        element: (
          <Suspense fallback={<Loader />}>
            <AdminPerRole />
          </Suspense>
        ),
      },
      {
        path: "documents",
        element: (
          <Suspense fallback={<Loader />}>
            <AdminDocument />
          </Suspense>
        ),
      },
      {
        path: "tracking",
        element: (
          <Suspense fallback={<Loader />}>
            <Tracking />
          </Suspense>
        ),
      },
    ],
  },
  // 404 Not Found
  {
    path: '*',
    element: <NotFound />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);