import {useEffect, useState} from 'react';
import {Link} from 'react-router';
import './App.css';
import {Navbar01, type Navbar01Props} from './components/ui/shadcn-io/navbar-01';

interface Forecast {
    date: string;
    temperatureC: number;
    temperatureF: number;
    summary: string;
}

const navbarProps: Navbar01Props = {
    logo: null,
    logoHref: "",
    navigationLinks: undefined,
    signInText: "Sign in",
    signInHref: "/signin",
    ctaText: "Log in",
    ctaHref: "/login",
    onSignInClick: undefined,
    onCtaClick: undefined,
};

function App() {
    const url = "https://react-reader.metabits.no/files/alice.epub";
    const title = "Alice in wonderland";
    const [forecasts, setForecasts] = useState<Forecast[]>();

    useEffect(() => {
        populateWeatherData();
    }, []);

    const contents = forecasts === undefined
        ? <p><em>Loading... Please refresh once the ASP.NET backend has started. See <a href="https://aka.ms/jspsintegrationreact">https://aka.ms/jspsintegrationreact</a> for more details.</em></p>
        : <table className="table table-striped" aria-labelledby="tableLabel">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Temp. (C)</th>
                    <th>Temp. (F)</th>
                    <th>Summary</th>
                </tr>
            </thead>
            <tbody>
                {forecasts.map(forecast =>
                    <tr key={forecast.date}>
                        <td>{forecast.date}</td>
                        <td>{forecast.temperatureC}</td>
                        <td>{forecast.temperatureF}</td>
                        <td>{forecast.summary}</td>
                    </tr>
                )}
            </tbody>
        </table>;

    return (
        <>
            <Navbar01 {...navbarProps}> Navbar </Navbar01>
            <div>
                <h1 id="tableLabel">Weather forecast</h1>
                <p>This component demonstrates fetching data from the server.</p>
                {contents}
                <Link to={`/reader/?url=${url}&title=${title}`}>
                    Alice in Wonderland
                </Link>
            </div>
        </>
    );

    async function populateWeatherData() {
        const response = await fetch('api/weatherforecast');
        if (response.ok) {
            const data = await response.json();
            setForecasts(data);
        }
    }
}

export default App;
