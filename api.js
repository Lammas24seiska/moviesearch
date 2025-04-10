
// get api url and api key from environment variables
import { API_URL, API_KEY } from './env.js';

// A general function to fetch data from the API using any URL
async function fetchByUrl(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            if (response.status === 401) {
                return { error: true, message: "Unauthorized: Invalid API key. Please check your API key." };
            } else if (response.status === 404) {
                return { error: true, data: [], message: "Not Found: Invalid URL or resource." };
            } else {
                return { error: true, data: [], message: `HTTP error! status: ${response.status}` };
            }
        }
        const data = await response.json();
        if (data.Response === 'False') {
            if (data.Error === 'Movie not found!') {
                return { error: true, data: [], message: 'No results for query' };
            }
            return { error: true, data: [], message: `API error! message: ${data.Error}` };
        }
        return { error: false, data: data.Search || data, message: "OK"};
    } catch (error) {
        console.error("Error fetching data:", error);
        return { error: true, data: [], message: error.message };
    }
}

// Fetch search results by search term
// Precondition: -
// Postcondition: returns a promise that resolves to an object containing the data or an error message
export async function fetchDataBySearch(searchTerm, pageNum, type="all") {
    const data = fetchByUrl(`${API_URL}?apikey=${API_KEY}&s=${searchTerm}&page=${pageNum}${type !== "all" ? `&type=${type}` : ''}`);
    return data;
}

// Fetch data by IMBD ID
// Precondition: -
// Postcondition: returns a promise that resolves to an object containing the data or an error message
export async function fetchDataById(id) {
    const data = fetchByUrl(`${API_URL}?apikey=${API_KEY}&i=${id}&plot=full`);
    return data;
}