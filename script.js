
import { 
    searchMovies, 
    moreSearchResults, 
    searchCategoryMovies, 
    moreCategoryMovies, 
    addToCategory, 
    removeFromCategory, 
    getCategories, 
    addCategory, 
    removeCategory, 
    movieExistsInCategory, 
    getMovieDetails 
} from './service.js';

// Select all text in the input field when it is clicked on
document.getElementById("search-input").addEventListener("focus", function () {
    this.select();
});

function displayMovieOverlay() {
    document.getElementById("movie-detail-overlay").classList.add("active");
}
window.displayMovieOverlay = displayMovieOverlay;

function hideMovieOverlay() {
    document.getElementById("movie-detail-overlay").classList.remove("active");
}
window.hideMovieOverlay = hideMovieOverlay;

// Set filled attribute for a number of stars equal to the rating value
function paintStars(rating) {
    const ratingValue = Math.round(rating);
    const ratings = document.getElementById("rating").children;
    for (let i = 0; i < ratings.length; i++) {
        if (i < ratingValue) {
            ratings[i].children[0].classList.add("filled");
        } else {
            ratings[i].children[0].classList.remove("filled");
        }
    }
}

// Set the new values for the movie details overlay
function editMovieOverlay(data) {
    const detailDiv = document.getElementById("movie-details");

    const posterDiv = detailDiv.children[0];
    posterDiv.children[0].src = data.Poster;
    posterDiv.children[0].alt = data.Title + " Poster";
    if (data.PGRating !== null) {
        posterDiv.children[1].classList.remove("hidden");
        posterDiv.children[1].innerText = data.PGRating;
    } else {
        posterDiv.children[1].classList.add("hidden");
    }

    const titleDiv = detailDiv.children[1];
    titleDiv.children[0].innerText = data.Title + " (" + data.Year + ")";
    titleDiv.children[1].innerText = data.Genre;
    paintStars(data.Rating);
    titleDiv.children[3].innerText = data.Plot;

    const castInfo = detailDiv.children[2];
    castInfo.children[1].innerText = data.Director;
    castInfo.children[3].innerText = data.Writer;
    castInfo.children[5].innerText = data.Stars;
    castInfo.children[7].innerText = data.Awards;
    //Hide the information titles if the data is not available
    castInfo.children[0].classList.toggle("hidden", data.Director === null);
    castInfo.children[2].classList.toggle("hidden", data.Writer === null);
    castInfo.children[4].classList.toggle("hidden", data.Stars === null);
    castInfo.children[6].classList.toggle("hidden", data.Awards === null);

    const numInfo = detailDiv.children[3];
    numInfo.children[1].innerText = data.ReleaseDate;
    numInfo.children[3].innerText = data.Runtime;
    numInfo.children[5].innerText = data.Language;
    numInfo.children[7].innerText = data.Country;
    numInfo.children[9].innerText = data.BoxOffice;

    //Hide the information titles if the data is not available
    numInfo.children[0].classList.toggle("hidden", data.ReleaseDate === null);
    numInfo.children[2].classList.toggle("hidden", data.Runtime === null);
    numInfo.children[4].classList.toggle("hidden", data.Language === null);
    numInfo.children[6].classList.toggle("hidden", data.Country === null);
    numInfo.children[8].classList.toggle("hidden", data.BoxOffice === null);

    const ratingInfo = detailDiv.children[4];
    ratingInfo.innerHTML = ""; // Clear previous ratings
    data.Ratings.forEach((rating) => {
        const ratingElem = document.createElement("LI");
        ratingElem.innerText = rating.Source + ": " + rating.Value;
        ratingInfo.appendChild(ratingElem);
    });
}

// Create search result DOM elements based on data
// movies: the list of movies to display
// erase: whether to erase the previous search results or not
function createDOMElementsForSearchResults(movies, erase=true, hideExistingFavorites=true) {
    const searchResultsContainer = document.getElementById("results-container");
    if (erase) searchResultsContainer.innerHTML = "";

    // get all 

    // Create dom element for each movie and append it to the search results container
    if (movies ==undefined) {return;}
    movies.forEach((movie) => {
        const movieCard = document.createElement("div");
        movieCard.className = "result";
        movieCard.id = movie.Id;
        const hidden = hideExistingFavorites ? (movieExistsInCategory(movie.Id, "favorites") ? "hidden" : "") : "";
        const buttonText = movieExistsInCategory(movie.Id, "favorites") ? "-" : "+";
        const buttonClass = movieExistsInCategory(movie.Id, "favorites") ? "remove-favorite" : "add-favorite";
        movieCard.innerHTML = `
            <h3>${movie.Title}</h3>
            <img 
                src="${movie.Poster}" 
                alt="${movie.Title} Poster" 
                class="movie-poster"
                onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/330px-No-Image-Placeholder.svg.png?20200912122019'; this.alt='Image not available';"
            >
            <p>${movie.Year}</p>
            <button type="button" class="${buttonClass} ${hidden}">${buttonText}</button>
        `;
        searchResultsContainer.appendChild(movieCard);
    });
}

// Change the title text to the search term on all elements that have the class "titletext"
function changeTitleText(searchTerm) {
    const titletexts = document.querySelectorAll(".titletext");
    titletexts.forEach((titletext) => {
        titletext.innerText = searchTerm;
    });
}

// Show or hide the no-results message and search-text based on the search results
function gotResults(gotResults) {
    if (gotResults) {
        document.getElementById("no-results").classList.add("hidden");
        document.getElementById("search-text").classList.remove("hidden");
    }
    else {
        document.getElementById("no-results").classList.remove("hidden");
        document.getElementById("search-text").classList.add("hidden");
    }
}

// Toggle search-input rquired attributed based on selected source
const sourceSelect = document.getElementById("data-source");
sourceSelect.addEventListener("change", () => {
    const searchInput = document.getElementById("search-input");
    if (sourceSelect.value === "imdb") {         
        searchInput.setAttribute('required', '');
    } else {
        searchInput.removeAttribute('required');
    }
});


// Movie search and detail handling code

// Search movies by search term
const loadMoreButton = document.getElementById("see-more");
const searchForm = document.getElementById("search-form");
searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    document.getElementById("welcome-card").classList.add("hidden");
    const searchTerm = document.getElementById("search-input").value;
    const source = document.getElementById("data-source").value;
    let result;
    const type = document.getElementById("search-type").value;
    let hideExistingFavorites = true;
    if (source === "imdb") {
        result = await searchMovies(searchTerm, type);
        if (result.error) {
            result = {data: [], message: "No results found"};
        }
    } else {
        result = searchCategoryMovies(searchTerm, type, source)
        hideExistingFavorites = false;
    }
        
    createDOMElementsForSearchResults(result.data, true, hideExistingFavorites);
    changeTitleText(searchTerm);

    if (result.data.length < 10) {
        loadMoreButton.classList.add("hidden");
    } else {
        loadMoreButton.classList.remove("hidden");
    }

    gotResults(result.data.length > 0);
});


// TODO: change all the element queries to use a saved variable instead of querying the DOM each time
// TODO: User testing
// TODO: unit tests
// TODO: clean css
// TODO: make readme file

// event listener for the add-favorite button
const resultsContainer = document.getElementById("results-container");
resultsContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("add-favorite")) {
        const id = e.target.closest(".result").id;
        addToCategory("favorites", id);
        // hide the button
        e.target.classList.add("hidden");
    }
});

// event listener for the remove-favorite button
resultsContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-favorite")) {
        const id = e.target.closest(".result").id;
        removeFromCategory("favorites", id);
        // show the button
        e.target.classList.add("hidden");
    }
});

// Search more results with bottom button
loadMoreButton.addEventListener("click", async () => {
    const source = document.getElementById("data-source").value;
    let result;
    if (source === "imdb") {
        result = await moreSearchResults();
    } else {
        result = await moreCategoryMovies()
    }
    createDOMElementsForSearchResults(result.data, false);
    if (result.data.length < 10) {
        loadMoreButton.classList.add("hidden");
    }
});

// Show movie details when clicked
resultsContainer.addEventListener("click", async (e) => {
    const movie = e.target.closest(".result");
    if (movie && e.target.tagName !== "BUTTON") {
        const movieId = movie.id;
        const result = await getMovieDetails(movieId);
        if (result.error) {
            // Handle no results
            console.log(result.message);
            return;
        }
        editMovieOverlay(result.data);
        displayMovieOverlay();
    }
});
