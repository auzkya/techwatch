import { Outlet } from "react-router-dom";
import { NotificationProvider } from "../context/NotificationContext";
import Header from "./Header";

const MainLayout = () => {
    return (
            <NotificationProvider>
                <Header />
                <div className="content-wrapper">
                    <Outlet /> {/* Tady se vykreslí ty routes z pole layoutRoutes */}
                </div>
            </NotificationProvider>
    );
};

export default MainLayout;
