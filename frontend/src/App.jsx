import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login'; import Dashboard from './pages/Dashboard'; import Expenses from './pages/Expenses';
import './styles.css';
function Shell(){const {user,logout}=useAuth();const navigate=useNavigate();return <div className="app-shell"><aside className="sidebar"><h2>Expense<span>Desk</span></h2><nav><Link to="/">Dashboard</Link><Link to="/expenses">Expenses</Link></nav><div className="profile"><b>{user.name}</b><small>{user.role}</small><button className="secondary" onClick={()=>{logout();navigate('/login');}}>Logout</button></div></aside><main className="content"><Routes><Route path="/" element={<Dashboard/>}/><Route path="/expenses" element={<Expenses/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></main></div>}
function AppRoutes(){const {user}=useAuth();return <Routes><Route path="/login" element={user?<Navigate to="/" replace/>:<Login/>}/><Route element={<ProtectedRoute/>}><Route path="/*" element={<Shell/>}/></Route></Routes>}
export default function App(){return <BrowserRouter><AuthProvider><AppRoutes/></AuthProvider></BrowserRouter>;}
