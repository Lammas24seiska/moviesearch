import { fetchDataById, fetchDataBySearch } from './api.js';

let currentPage = 1;
let currentSearchTerm = "";
let lastIndex = 0;
let currentType = "all";

// Maps the fetched correct data to the required format
// Precondition: data is an array of objects with properties: Title, Year, Poster, imdbID
// Postcondition: returns an array of objects with properties: idx, ID, Title, Year, Poster
// Example return value: [{ idx: 0, ID: "tt1375666", Title: "Inception", Year: "2010", Poster: "https://example.com/poster.jpg" }]
function mapSearchResult(data, shift = 0) {
    return data.map((movie, index) => {
        return {
            idx: index + shift,
            ID: movie.imdbID,
            Title: movie.Title,
            Year: movie.Year,
            Poster: movie.Poster !== "N/A" ? movie.Poster : null
        };
    });
}

function checkNAorUndefined(value) {
    return value ? (value === "N/A" ? null : value) : null;
}

// Fetch movie details by search term
// Precondition: searchTerm is a non-empty string
// Postcondition: returns a promise that resolves to an object containing the data or an error message
// Invariant: currentPage is reset to 1 and currentSearchTerm is updated
// Example return value: 
// fetch was succesfull: { error: false, Search: [{ Title: "Inception", Year: "2010", ... }] }
// fetch was not succesfull: { error: true, message: "Movie not found" }
export async function searchMovies(searchTerm, type = "all") {
    currentPage = 1;
    currentSearchTerm = searchTerm;
    lastIndex = 0;
    currentType = type;
    const data = await fetchDataBySearch(searchTerm, currentPage, currentType);
    if (data.error) {
        return { error: true, data: [], message: data.message };
    }
    const returndata = {
        error: false,
        data: mapSearchResult(data.data),
        message: "OK",
    }
    lastIndex = returndata.data.length - 1;
    return returndata;

}

// Fetch more search results
// Precondition: a previous search has been made
// Postcondition: returns a promise that resolves to an object containing the data or an error message
// Invariant: currentPage is incremented by 1 each call, and currentSearchTerm is maintained
// Example return value:
// fetch was succesfull: { error: false,  Search: [{ Title: "Inception", Year: "2010", ... }] }
// fetch was not succesfull: { error: true, message: "Movie not found" }
export async function moreSearchResults() {
    currentPage++;
    const data = await fetchDataBySearch(currentSearchTerm, currentPage, currentType);
    if (data.error) {
        return { error: true, data: [], message: data.message };
    }
    const returndata = {
        error: false,
        data: mapSearchResult(data.data, lastIndex + 1),
        message: "OK",
    }
    lastIndex += returndata.data.length;
    return returndata;
}

// Fetch movie details by ID
// Precondition: id is a non-empty string
// Postcondition: returns a promise that resolves to an object containing the data or an error message
// Example return value:
// fetch was succesfull: { error: false, data: { Title: "Inception", Year: "2010", ... } }
// fetch was not succesfull: { error: true, message: "Movie not found" }
export async function getMovieDetails(id) {
    const data = await fetchDataById(id);
    if (data.error) {
        return { error: true, data: {}, message: data.message };
    }

    // Take the interesting details from the data and handle N/A and undefined values
    const details = data.data;
    const sanitizedDetails = {};
    Object.entries({
        Poster: details.Poster,
        PGRating: details.Rated,
        Title: details.Title,
        Year: details.Year,
        Type: details.Type,
        Genre: details.Genre,
        Rating: details.imdbRating,
        Plot: details.Plot,
        Director: details.Director,
        Writer: details.Writer,
        Stars: details.Actors,
        Awards: details.Awards,
        ReleaseData: details.Released,
        Runtime: details.Runtime,
        Language: details.Language,
        Country: details.Country,
        BoxOffice: details.BoxOffice,
        Ratings: details.Ratings,

    }).forEach(([key, value]) => {
        sanitizedDetails[key] = checkNAorUndefined(value);
    });
    return {
        error: false,
        data: sanitizedDetails,
        message: "OK",
    };
}