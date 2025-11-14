import {useEffect} from 'react';
import {Link, useNavigate} from 'react-router';
import './App.css';
import {Navbar01, type Navbar01Props, Logo} from '@/components/Navbar';
import {useAppState} from '@/lib/store';

function App() {
    const url = "https://react-reader.metabits.no/files/alice.epub";
    const title = "Alice in wonderland";
    const navigate = useNavigate();
    const {currentUser, logout, initializeAuth} = useAppState();

    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    const navbarProps: Navbar01Props = {
        logo: <Logo />,
        signInText: "Sign in",
        signInHref: "/signin",
        ctaText: "Log in",
        ctaHref: "/login",
        onSignInClick: () => navigate("/signin"),
        onCtaClick: () => navigate("/login"),
        currentUser: currentUser || null,
        onLogout: () => {
            logout();
            navigate("/");
        },
    };
    return (
        <>
            <Navbar01 {...navbarProps}> Navbar </Navbar01>
            <div className="text-center m-12 p-auto">
                <Link to={`/reader/?url=${url}&title=${title}`}>
                    Alice in Wonderland
                </Link>
            </div>

        </>
    );

}

export default App;
