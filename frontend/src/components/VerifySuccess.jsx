import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const VerifySuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { loginUser } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');

        if (token) {
            console.log('🎉 Email ověřen, přihlašuji uživatele...');

            // Zavolej loginUser s tokenem
            loginUser(token)
                .then(() => {
                    console.log('✅ Uživatel přihlášen po verifikaci');
                    navigate('/', { replace: true });
                })
                .catch(err => {
                    console.error('❌ Chyba při přihlášení po verifikaci:', err);
                    navigate('/login?error=verification_failed');
                });
        } else {
            console.error('❌ Token chybí v URL');
            navigate('/login?error=no_token');
        }
    }, [searchParams, navigate, loginUser]);

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>✅ Email byl ověřen!</h2>
            <p>Probíhá přihlášení...</p>
        </div>
    );
};

export default VerifySuccess;
