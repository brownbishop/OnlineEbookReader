import {useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router';
import './App.css';
import {Navbar01, type Navbar01Props} from './components/ui/shadcn-io/navbar-01';

interface Forecast {
    date: string;
    temperatureC: number;
    temperatureF: number;
    summary: string;
}


function App() {
    const url = "https://react-reader.metabits.no/files/alice.epub";
    const title = "Alice in wonderland";
    const navigate = useNavigate();

    const navbarProps: Navbar01Props = {
        logo: null,
        logoHref: "",
        navigationLinks: [],
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
        </>
    );

}

export default App;
