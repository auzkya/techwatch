import { Outlet } from "react-router-dom";
import { AlertProvider } from "../context/AlertContext";
import { NotificationProvider } from "../context/NotificationContext";
import Header from "./Header";

const MainLayout = () => {
    return (
        <AlertProvider>
            <NotificationProvider>
                <Header />
                <div className="content-wrapper">
                    <Outlet /> {/* Tady se vykreslí ty routes z pole layoutRoutes */}
                </div>
            </NotificationProvider>
        </AlertProvider>
    );
};

export default MainLayout;
