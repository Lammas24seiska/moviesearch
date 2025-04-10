import { fetchDataById, fetchDataBySearch } from './api.js';

let currentPage = 1;
let currentSearchTerm = "";
let lastIndex = 0;
let currentType = "all";

let fetchedData = [];
let categories = JSON.parse(localStorage.getItem("SEARCHcategories")) || [];

// Maps the fetched correct data to the required format
// Precondition: data is an array of objects with properties: Title, Year, Poster, imdbID
// Postcondition: returns an array of objects with properties: idx, ID, Title, Year, Poster
// Example return value: [{ idx: 0, ID: "tt1375666", Title: "Inception", Year: "2010", Poster: "https://example.com/poster.jpg" }]
function mapSearchResult(data, shift = 0) {
    return data.map((movie, index) => {
        return {
            idx: index + shift,
            Id: movie.imdbID,
            Title: movie.Title,
            Year: movie.Year,
            Poster: movie.Poster !== "N/A" ? movie.Poster : null
        };
    });
}

// Truncates all "bad" values to null preserving good data
function checkNAorUndefined(value) {
    return value ? (value === "N/A" ? null : value) : null;
}

// Splits the array into chunks of the specified size
function chunkArray(array, chunkSize) {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize));
    }
    return result;
}

function toCategoryVariable(category) {
    return "CAT:" + category;
}

function fromCategoryVariable(category) {
    return category.replace("CAT:", "");
}


// Fetch movie details by search term from local storage
// Predondition: input variables are strings
// Postcondition: returns an array of objects containing the data or an empty array
// Example return value: [{ Title: "Inception", Year: "2010", ... }]
function getLocalStorageData(category, searchTerm, type) {
    // Get all the data from the local storage by category
    const storedData = JSON.parse(localStorage.getItem(toCategoryVariable(category))) || [];

    // filter data by search term and by type
    const filteredData = storedData.filter((movie) => {
        return (movie.Title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (type === "all" || movie.Type.toLowerCase() === type.toLowerCase()));
    });

    return filteredData;
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

// Fetch serch results for a specific category
// Precondition: input variables are strings
// Postcondition: returns an array of objects containing 0-10 results
// Example return value: { error: false,  Search: [{ Title: "Inception", Year: "2010", ... }] }
export function searchCategoryMovies(searchTerm, type, category) {
    // get results from local storage by category and filtered by search term and type
    const storedData = getLocalStorageData(category, searchTerm, type);

    // divide data into pages and add the data to the fetched data variable 
    fetchedData = chunkArray(storedData, 10);
    
    // return filtered data first page'
    currentPage = 1;
    return {error: false, data: (fetchedData[0] || []), message: "OK"};
}

// Fetch more search results for a specific category
// Precondition: a previous search has been made
// Postcondition: returns an array of objects containing 0-10 results
// Example return value: { error: false,  Search: [{ Title: "Inception", Year: "2010", ... }] }
export function moreCategoryMovies() {
    // increment current page
    currentPage++;

    // return the next page of the data and empty if there is no more data
    return {error: false, data: (fetchedData[currentPage -1] || []), message: "OK"};
}

// Add movie to a category
// Precondition: category is a string and movieId is a string
// Postcondition: saves the movieId to the specified category in local storage
// Example: saveToCategory("favorites", "tt1375666")
// Example return value: { error: false, message: "OK" }
export async function addToCategory(category, movieId) {
    // get the necessary details for the category from api
    const data = await fetchDataById(movieId);
    const movieDetails = {
        Id: data.data.imdbID,
        Title: data.data.Title,
        Year: data.data.Year,
        Poster: data.data.Poster,
        Type: data.data.Type,
    };
    // check if the category exists in local storage, if not create it
    if (!categories.includes(category)) {
        categories.push(category);
        localStorage.setItem("SEARCHcategories", JSON.stringify(categories));
    }

    // get the current category container from local storage
    const storedData = JSON.parse(localStorage.getItem(toCategoryVariable(category))) || [];
    // check if the movie is already in the category
    if (storedData.some((movie) => movie.Id === movieId)) {
        return { error: true, message: "Movie already exists in category" };
    }
    // append to category container and save to local storage
    storedData.push(movieDetails);
    localStorage.setItem(toCategoryVariable(category), JSON.stringify(storedData));
    return { error: false, message: "OK" };

}

// Remove movie from a category
// Precondition: category is a string and movieId is a string
// Postcondition: removes the movieId from the specified category in local storage
// Example: removeFromCategory("favorites", "tt1375666")
// Example return value: { error: false, message: "OK" }
export async function removeFromCategory(category, movieId) {
    // remove the movie details from the category container
    const storedData = JSON.parse(localStorage.getItem(toCategoryVariable(category))) || [];
    const updatedData = storedData.filter((movie) => movie.Id !== movieId);
    if(updatedData.length === storedData.length) {
        return { error: true, message: "Movie not found in category" };
    }
    localStorage.setItem(toCategoryVariable(category), JSON.stringify(updatedData));
    return { error: false, message: "OK" };
}

// Fetch all categories from local storage
// Precondition: -
// Postcondition: returns an array of strings containing the categories
// Example return value: ["favorites", "watchlist"]
export async function getCategories() {
    // return the categories
    return categories;
}

// Add a new category to local storage
// Precondition: category is a string
// Postcondition: adds the category to the categories in local storage
// Example: addCategory("watchlist")
// Example return value: { error: false, message: "OK" }
export async function addCategory(category) {
    // add the new category to the categories
    if (!categories.includes(category)) {
        categories.push(category);
        localStorage.setItem("SEARCHcategories", JSON.stringify(categories));
        return { error: false, message: "OK" };
    }
    return { error: true, message: "Category already exists" };
}

// Remove a category from local storage
// Precondition: category is a string
// Postcondition: removes the category from the categories in local storage
// Example: removeCategory("watchlist")
// Example return value: { error: false, message: "OK" }
export async function removeCategory(category) {
    // remove the category from the categories
    if (categories.includes(category)) {
        categories = categories.filter((cat) => cat !== category);
        localStorage.setItem("SEARCHcategories", JSON.stringify(categories));
        localStorage.removeItem(toCategoryVariable(category));
        return { error: false, message: "OK" };
    }
    return { error: true, message: "Category not found" };
}

// Check if a movie exists in a category
// Precondition: movieId is a string and category is a string
// Postcondition: returns true if the movieId exists in the category, false otherwise
export function movieExistsInCategory(movieId, category) {
    // check if the movie exists in the category
    const storedData = JSON.parse(localStorage.getItem(toCategoryVariable(category))) || [];
    return storedData.some((movie) => movie.Id === movieId);
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
        Id: details.imdbID,
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
        ReleaseDate: details.Released,
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