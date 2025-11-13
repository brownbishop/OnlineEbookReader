import {useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router';
import './App.css';
import {Navbar01, type Navbar01Props, Logo} from '@/components/ui/shadcn-io/navbar-01';
import BookLibrary from '@/components/BookLibrary';

function App() {
    const url = "https://react-reader.metabits.no/files/alice.epub";
    const title = "Alice in wonderland";
    const navigate = useNavigate();

    const navbarProps: Navbar01Props = {
        logo: <Logo />,
        signInText: "Sign in",
        signInHref: "/signin",
        ctaText: "Log in",
        ctaHref: "/login",
        onSignInClick: () => navigate("/signin"),
        onCtaClick: () => navigate("/login"),
    };
    return (
        <>
            <Navbar01 {...navbarProps}> Navbar </Navbar01>
            <div className="text-center m-12 p-auto">
                <Link to={`/reader/?url=${url}&title=${title}`}>
                    Alice in Wonderland
                </Link>
            </div>

            <BookLibrary/>
        </>
    );

}

export default App;
