import React, { useState, useEffect } from 'react';
import './StationSelector.css';

interface RadioStation {
    stationuuid: string;
    name: string;
    url: string;
    favicon: string;
    tags: string;
    country: string;
    language: string;
    codec: string;
    bitrate: number;
    votes: number;
    clickcount: number;
}

interface StationSelectorProps {
    onStationSelect: (station: RadioStation) => void;
    initialCountry?: string;
}

const StationSelector: React.FC<StationSelectorProps> = ({
                                                             onStationSelect,
                                                             initialCountry = 'all'
                                                         }) => {
    const [stations, setStations] = useState<RadioStation[]>([]);
    const [filteredStations, setFilteredStations] = useState<RadioStation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [countries, setCountries] = useState<string[]>([]);
    const [languages, setLanguages] = useState<string[]>([]);
    const [tags, setTags] = useState<string[]>([]);

    // Selected filters
    const [selectedCountry, setSelectedCountry] = useState(initialCountry);
    const [selectedLanguage, setSelectedLanguage] = useState('all');
    const [selectedTag, setSelectedTag] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Sort options
    const [sortBy, setSortBy] = useState<'name' | 'votes' | 'clickcount'>('votes');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const stationsPerPage = 10;

    // Fetch countries, languages, and tags on mount
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                // Fetch countries
                const countriesResponse = await fetch('https://de1.api.radio-browser.info/json/countries');
                const countriesData = await countriesResponse.json();
                const countryNames = countriesData
                    .filter((item: any) => item.name && item.stationcount > 5)
                    .map((item: any) => item.name)
                    .sort();
                setCountries(['all', ...countryNames]);

                // Fetch languages
                const languagesResponse = await fetch('https://de1.api.radio-browser.info/json/languages');
                const languagesData = await languagesResponse.json();
                const languageNames = languagesData
                    .filter((item: any) => item.name && item.stationcount > 5)
                    .map((item: any) => item.name)
                    .sort();
                setLanguages(['all', ...languageNames]);

                // Fetch tags
                const tagsResponse = await fetch('https://de1.api.radio-browser.info/json/tags');
                const tagsData = await tagsResponse.json();
                const tagNames = tagsData
                    .filter((item: any) => item.name && item.stationcount > 5)
                    .map((item: any) => item.name)
                    .sort();
                setTags(['all', ...tagNames]);
            } catch (err) {
                setError('Failed to load filter options. Please try again later.');
            }
        };

        fetchMetadata();
    }, []);

    // Fetch stations based on filters
    useEffect(() => {
        const fetchStations = async () => {
            setLoading(true);
            setError(null);

            let url = 'https://de1.api.radio-browser.info/json/stations/search?';

            // Add filters to URL
            const params = new URLSearchParams();

            if (selectedCountry !== 'all') {
                params.append('country', selectedCountry);
            }

            if (selectedLanguage !== 'all') {
                params.append('language', selectedLanguage);
            }

            if (selectedTag !== 'all') {
                params.append('tag', selectedTag);
            }

            if (searchTerm) {
                params.append('name', searchTerm);
            }

            // Sort by popularity by default
            params.append('order', sortBy);
            params.append('reverse', 'true');
            params.append('limit', '100'); // Get a decent number of stations

            try {
                const response = await fetch(`${url}${params.toString()}`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();

                // Filter out stations with invalid URLs
                const validStations = data.filter((station: RadioStation) =>
                    station.url &&
                    station.url.trim() !== '' &&
                    (station.url.startsWith('http://') || station.url.startsWith('https://'))
                );

                setStations(validStations);
                setFilteredStations(validStations);
                setCurrentPage(1);
            } catch (err) {
                setError('Failed to load stations. Please try again later.');
                setStations([]);
                setFilteredStations([]);
            } finally {
                setLoading(false);
            }
        };

        fetchStations();
    }, [selectedCountry, selectedLanguage, selectedTag, sortBy]);

    // Handle search
    useEffect(() => {
        if (searchTerm === '') {
            setFilteredStations(stations);
        } else {
            const filtered = stations.filter(station =>
                station.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredStations(filtered);
        }
        setCurrentPage(1);
    }, [searchTerm, stations]);

    // Calculate pagination
    const indexOfLastStation = currentPage * stationsPerPage;
    const indexOfFirstStation = indexOfLastStation - stationsPerPage;
    const currentStations = filteredStations.slice(indexOfFirstStation, indexOfLastStation);
    const totalPages = Math.ceil(filteredStations.length / stationsPerPage);

    // Pagination controls
    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    // Handle station selection
    const handleStationSelect = (station: RadioStation) => {
        onStationSelect(station);
    };

    return (
        <div className="station-selector">
            <h2>Radio Station Explorer</h2>

    <div className="search-bar">
    <input
        type="text"
    placeholder="Search stations..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="search-input"
        />
        </div>

        <div className="filters">
    <div className="filter-group">
        <label>Country:</label>
    <select
    value={selectedCountry}
    onChange={(e) => setSelectedCountry(e.target.value)}
>
    {countries.map(country => (
        <option key={country} value={country}>{country}</option>
    ))}
    </select>
    </div>

    <div className="filter-group">
        <label>Language:</label>
    <select
    value={selectedLanguage}
    onChange={(e) => setSelectedLanguage(e.target.value)}
>
    {languages.map(language => (
        <option key={language} value={language}>{language}</option>
    ))}
    </select>
    </div>

    <div className="filter-group">
        <label>Genre:</label>
    <select
    value={selectedTag}
    onChange={(e) => setSelectedTag(e.target.value)}
>
    {tags.map(tag => (
        <option key={tag} value={tag}>{tag}</option>
    ))}
    </select>
    </div>

    <div className="filter-group">
        <label>Sort by:</label>
    <select
    value={sortBy}
    onChange={(e) => setSortBy(e.target.value as 'name' | 'votes' | 'clickcount')}
>
    <option value="votes">Popularity</option>
        <option value="name">Name</option>
        <option value="clickcount">Listeners</option>
        </select>
        </div>
        </div>

    {loading ? (
        <div className="loading">Loading stations...</div>
    ) : error ? (
        <div className="error">{error}</div>
    ) : filteredStations.length === 0 ? (
        <div className="no-results">No stations found. Try different filters.</div>
    ) : (
        <>
            <div className="stations-list">
            {currentStations.map(station => (
                    <div
                        key={station.stationuuid}
                className="station-item"
                onClick={() => handleStationSelect(station)}
    >
        <div className="station-logo">
            {station.favicon ? (
                        <img
                            src={station.favicon}
                    alt={`${station.name} logo`}
        onError={(e) => {
        (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 16.3c2.1-1.4 4.5-2.2 7-2.2s4.9.8 7 2.2"/></svg>';
    }}
        />
    ) : (
        <div className="default-logo">📻</div>
    )}
        </div>

        <div className="station-info">
    <h3 className="station-name">{station.name}</h3>
        <div className="station-details">
        <span>{station.country}</span>
        {station.language && <span> • {station.language}</span>}
            {station.bitrate > 0 && <span> • {station.bitrate} kbps</span>}
            </div>
                {station.tags && (
                    <div className="station-tags">
                        {station.tags.split(',').slice(0, 3).map(tag => (
                                <span key={tag} className="tag">{tag.trim()}</span>
                ))}
                    </div>
                )}
                </div>

                <div className="station-stats">
            <div className="votes">
            <span className="vote-icon">👍</span> {station.votes}
            </div>
            </div>
            </div>
            ))}
            </div>

            {totalPages > 1 && (
                <div className="pagination">
                <button
                    onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="page-button"
                    >
                    &laquo; Prev
            </button>

            <span className="page-info">
                Page {currentPage} of {totalPages}
                </span>

                <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="page-button"
                    >
                    Next &raquo;
                </button>
                </div>
            )}
            </>
        )}
        </div>
    );
    };

        export default StationSelector;