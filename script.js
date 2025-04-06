document.addEventListener("DOMContentLoaded", () => {
    const languageSelect = document.getElementById("language");

    languageSelect.addEventListener("change", (event) => {
        const selectedOption = event.target.value;
        const languageImages = {
            en: "images/lang/en.png",
            fi: "images/lang/fi.png",
        };
        languageSelect.style.backgroundImage = `url('${languageImages[selectedOption]}')`;
        languageSelect.style.backgroundRepeat = "no-repeat";
        languageSelect.style.backgroundPosition = "right 15px center";
        languageSelect.style.backgroundSize = "20px 20px";
    });
    const initialLanguage = languageSelect.value;
    languageSelect.style.backgroundImage = `url('images/lang/${initialLanguage}.png')`;
    languageSelect.style.backgroundRepeat = "no-repeat";
    languageSelect.style.backgroundPosition = "right 15px center";
    languageSelect.style.backgroundSize = "20px 20px";

    const sortDirectionButton = document.getElementById('sort-direction');
    if (sortDirectionButton) {
        sortDirectionButton.addEventListener('click', () => {
            const currentValue = sortDirectionButton.value;
            sortDirectionButton.value = currentValue === 'asc' ? 'desc' : 'asc';
            sortDirectionButton.textContent = sortDirectionButton.value === 'asc' ? '↑' : '↓';
        });
    }

});
