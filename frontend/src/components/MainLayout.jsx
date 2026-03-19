import { Outlet } from "react-router-dom";
import { NotificationProvider } from "../context/NotificationContext";
import Header from "./Header";

const MainLayout = () => {
    return (
        <NotificationProvider>
            <Header />
            <div className="content-wrapper">
                <Outlet />{" "}
                {/* Vykreslení tras definovaných v `layoutRoutes` */}
            </div>
        </NotificationProvider>
    );
};

export default MainLayout;
