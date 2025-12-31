import AppRoutes from "./routes/AppRoutes";
import { AlertProvider } from "./context/AlertContext";
import { AuthProvider } from "./context/AuthContext";

const App = () => {
    return (
        <>
            <AlertProvider>
                <AuthProvider>
                    <main>
                        <AppRoutes />
                    </main>
                </AuthProvider>
            </AlertProvider>
        </>
    );
};

export default App;
