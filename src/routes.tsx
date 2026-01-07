import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/protectedRoute';

// Auth Routes
import Login from './pages/login';
import ForgotPassword from './pages/forgotPassword';
import ResetPassword from './pages/resetPassword';

// AVA Routes
import Dashboard from './pages/dashboard';
import Course from './pages/course';
import EducatorsPage from './pages/educatorsPage';
import Profile from './pages/profile';
import Notifications from './pages/notifications';

function MyRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Login/>} />
                <Route path='/login' element={<Login/>} />
                <Route path='/forgot-password' element={<ForgotPassword/>} />
                <Route path='/reset-password' element={<ResetPassword/>} />
                <Route path='/dashboard' element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
                <Route path='/courses' element={<ProtectedRoute><EducatorsPage/></ProtectedRoute>} />
                <Route path='/course/:courseSlug' element={<ProtectedRoute><Course /></ProtectedRoute>} />
                <Route path='/course/:courseSlug/lesson/:lessonId' element={<ProtectedRoute><Course /></ProtectedRoute>} />
                <Route path='/profile' element={<ProtectedRoute><Profile/></ProtectedRoute>} />
                <Route path='/notifications' element={<ProtectedRoute><Notifications/></ProtectedRoute>} />
            </Routes>
        </BrowserRouter>
    )
}

export default MyRoutes;