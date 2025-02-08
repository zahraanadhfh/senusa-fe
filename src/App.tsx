import React from "react";
import {Route, Routes} from "react-router-dom";
import LandingPage from "./components/LandingPage.tsx";
import "./index.css";
import Dashboard from "./components/Dashboard.tsx";

const App: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<LandingPage/>}/>
            <Route path="/dashboard" element={<Dashboard/>}/>
        </Routes>
    );
};

export default App;
