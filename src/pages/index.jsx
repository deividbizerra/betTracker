import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Bankrolls from "./Bankrolls";

import Support from "./Support";

import Settings from "./Settings";

import Admin from "./Admin";

import BankrollDetail from "./BankrollDetail";

import AdminTickets from "./AdminTickets";

import SurebetCalculator from "./SurebetCalculator";

import Tutorials from "./Tutorials";

import Success from "./Success";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Bankrolls: Bankrolls,
    
    Support: Support,
    
    Settings: Settings,
    
    Admin: Admin,
    
    BankrollDetail: BankrollDetail,
    
    AdminTickets: AdminTickets,
    
    SurebetCalculator: SurebetCalculator,
    
    Tutorials: Tutorials,
    
    Success: Success,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Bankrolls" element={<Bankrolls />} />
                
                <Route path="/Support" element={<Support />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/Admin" element={<Admin />} />
                
                <Route path="/BankrollDetail" element={<BankrollDetail />} />
                
                <Route path="/AdminTickets" element={<AdminTickets />} />
                
                <Route path="/SurebetCalculator" element={<SurebetCalculator />} />
                
                <Route path="/Tutorials" element={<Tutorials />} />
                
                <Route path="/Success" element={<Success />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}