import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Auth Routes
import Login from './pages/login';
import ForgotPassword from './pages/forgotPassword';
import ResetPassword from './pages/resetPassword';

// AVA Routes
import Dashboard from './pages/dashboard';
import Course from './pages/course';

function MyRoutes() {
    return (
        <BrowserRouter>
            <Routes >
                <Route path='/' element={<Login/>} />
                <Route path='/login' element={<Login/>} />
                <Route path='/forgot-password' element={<ForgotPassword/>} />
                <Route path='/reset-password' element={<ResetPassword/>} />
                <Route path='/dashboard' element={<Dashboard/>} />
                <Route path='/course/:courseSlug' element={<Course />} />
            </Routes>
        </BrowserRouter>
    )
}

export default MyRoutes;