// Imports data from data.js
import { books, authors, genres, BOOKS_PER_PAGE } from "./data.js";

let page = 1;
let matches = books;

// HTML Elements Object
const htmlElements = {
  head: document.querySelector("head"),
  header: document.querySelector("header"),

  dataSettingsOverlay: document.querySelector("[data-settings-overlay]"),
  dataSettingsForm: document.querySelector("[data-settings-form]"),
  dataSettingsTheme: document.querySelector("[data-settings-theme]"),
  dataSettingsCancel: document.querySelector("[data-settings-cancel]"),

  dataHeaderSearch: document.querySelector("[data-header-search]"),
  dataHeaderSettings: document.querySelector("[data-header-settings]"),

  dataSearchOverlay: document.querySelector("[data-search-overlay]"),
  dataSearchForm: document.querySelector("[data-search-form]"),
  dataSearchTitle: document.querySelector("[data-search-title]"),
  dataSearchGenres: document.querySelector("[data-search-genres]"),
  dataSearchAuthers: document.querySelector("[data-search-authors]"),
  dataSearchCancel: document.querySelector("[data-search-cancel]"),

  dataListItems: document.querySelector("[data-list-items]"),
  dataListBlur: document.querySelector("[data-list-blur]"),
  dataListImage: document.querySelector("[data-list-image]"),
  dataListTitle: document.querySelector("[data-list-title]"),
  dataListSubtitle: document.querySelector("[data-list-subtitle]"),
  dataListDescription: document.querySelector("[data-list-description]"),
  dataListMessage: document.querySelector("[data-list-message]"),
  dataListButton: document.querySelector("[data-list-button]"),
  dataListActive: document.querySelector("[data-list-active]"),
  dataListClose: document.querySelector("[data-list-close]"),
};

// Calls functions on dom load
document.addEventListener("DOMContentLoaded", () => {
  getMETAHTML();
  addBookPreview();
  setupEventListeners();
});

//Fetches data then adds it to dom
function getMETAHTML() {
  fetch("./meta.html")
    .then((response) => response.text())
    .then((data) => {
      htmlElements.head.innerHTML = data;
    });
}

// Creates book element for html
function createBookElement({ author, id, image, title }) {
  const element = document.createElement("button");
  element.classList.add("preview");
  element.dataset.preview = id;

  element.innerHTML = `
    <img class="preview__image" src="${image}" />
    <div class="preview__info">
      <h3 class="preview__title">${title}</h3>
      <div class="preview__author">${authors[author]}</div>
    </div>
  `;

  return element;
}
// Adds book preview to html
function addBookPreview() {
  const starting = document.createDocumentFragment();
  for (const book of matches.slice(0, BOOKS_PER_PAGE)) {
    const element = createBookElement(book);
    starting.appendChild(element);
  }
  htmlElements.dataListItems.appendChild(starting);
}

// Creates option element
function createOption(value, text) {
  const option = document.createElement("option");
  option.value = value;
  option.innerText = text;
  return option;
}

// Function populates select element with genres && Authors
function populateSelect(element, options, firstOptionText) {
  const fragment = document.createDocumentFragment();
  fragment.appendChild(createOption("any", firstOptionText));
  for (const [value, text] of Object.entries(options)) {
    fragment.appendChild(createOption(value, text));
  }
  element.appendChild(fragment);
}

// Populate genres select
populateSelect(htmlElements.dataSearchGenres, genres, "All Genres");

// Populate authors select
populateSelect(htmlElements.dataSearchAuthers, authors, "All Authors");

// Update the "Show more" button
const remainingBooks = matches.length - page * BOOKS_PER_PAGE;
htmlElements.dataListButton.innerHTML = `
  <span>Show more</span>
  <span class="list__remaining"> (${
    remainingBooks > 0 ? remainingBooks : 0
  })</span>
`;
htmlElements.dataListButton.disabled = remainingBooks <= 0;
htmlElements.dataListButton.innerText = `Show more (${
  books.length - BOOKS_PER_PAGE
})`;

// Handles Click events
function setupEventListeners() {
  htmlElements.dataSearchCancel.addEventListener("click", () => {
    htmlElements.dataSearchOverlay.open = false;
  });

  htmlElements.dataSettingsCancel.addEventListener("click", () => {
    htmlElements.dataSettingsOverlay.open = false;
  });

  htmlElements.dataHeaderSearch.addEventListener("click", () => {
    htmlElements.dataSearchOverlay.open = true;
    htmlElements.dataSearchTitle.focus();
  });

  htmlElements.dataHeaderSettings.addEventListener("click", () => {
    htmlElements.dataSettingsOverlay.open = true;
  });

  htmlElements.dataListClose.addEventListener("click", () => {
    htmlElements.dataListActive.open = false;
  });

  // Handles event listener for search form
  htmlElements.dataSearchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const filters = Object.fromEntries(formData);
    const result = books.filter((book) => {
      const titleMatch =
        filters.title.trim() === "" ||
        book.title.toLowerCase().includes(filters.title.toLowerCase());
      const authorMatch =
        filters.author === "any" || book.author === filters.author;
      const genreMatch =
        filters.genre === "any" || book.genres.includes(filters.genre);

      return titleMatch && authorMatch && genreMatch;
    });

    page = 1;
    matches = result;
    updateBookList(result);

    window.scrollTo({ top: 0, behavior: "smooth" });
    htmlElements.dataSearchOverlay.open = false;
  });

  // Handles event listener to show more
  htmlElements.dataListButton.addEventListener("click", () => {
    const fragment = document.createDocumentFragment();

    for (const book of matches.slice(
      page * BOOKS_PER_PAGE,
      (page + 1) * BOOKS_PER_PAGE
    )) {
      const element = createBookPreviewElement(book);
      fragment.appendChild(element);
    }

    htmlElements.dataListItems.appendChild(fragment);
    page += 1;

    htmlElements.dataListButton.disabled =
      matches.length <= page * BOOKS_PER_PAGE;
    htmlElements.dataListButton.innerHTML = `
    <span>Show more</span>
    <span class="list__remaining"> (${Math.max(
      matches.length - page * BOOKS_PER_PAGE,
      0
    )})</span>
  `;
  });

  // Handles event listener to show details of clicked book
  htmlElements.dataListItems.addEventListener("click", (event) => {
    const previewId = event.target.closest(".preview")?.dataset.preview;
    if (!previewId) return;

    const activeBook = books.find((book) => book.id === previewId);
    if (activeBook) {
      htmlElements.dataListActive.open = true;
      htmlElements.dataListBlur.src = activeBook.image;
      htmlElements.dataListImage.src = activeBook.image;
      htmlElements.dataListTitle.innerText = activeBook.title;
      htmlElements.dataListSubtitle.innerText = `${
        authors[activeBook.author]
      } (${new Date(activeBook.published).getFullYear()})`;
      htmlElements.dataListDescription.innerText = activeBook.description;
    }
  });
}

// Checks user prefrance for color theme
if (
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches
) {
  let theme = "night";
  toggleTheme(theme);
} else {
  let theme = "day";
  toggleTheme(theme);
}

// Handles color theme change
htmlElements.dataSettingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const { theme } = Object.fromEntries(formData);
  toggleTheme(theme);

  htmlElements.dataSettingsOverlay.open = false;
});

// Switches between Light and Dark themes
function toggleTheme(theme) {
  document.documentElement.style.setProperty(
    "--color-dark",
    theme === "night" ? "255, 255, 255" : "10, 10, 20"
  );
  document.documentElement.style.setProperty(
    "--color-light",
    theme === "night" ? "10, 10, 20" : "255, 255, 255"
  );
}

// Create book preview elements
function createBookPreviewElement({ author, id, image, title }) {
  const element = document.createElement("button");
  element.classList.add("preview");
  element.dataset.preview = id;

  element.innerHTML = `
    <img class="preview__image" src="${image}" />
    <div class="preview__info">
      <h3 class="preview__title">${title}</h3>
      <div class="preview__author">${authors[author]}</div>
    </div>
  `;

  return element;
}

// Updates book list
function updateBookList(result) {
  const newItems = document.createDocumentFragment();

  for (const book of result.slice(0, BOOKS_PER_PAGE)) {
    const element = createBookPreviewElement(book);
    newItems.appendChild(element);
  }

  htmlElements.dataListItems.innerHTML = "";
  htmlElements.dataListItems.appendChild(newItems);

  htmlElements.dataListButton.disabled = result.length <= BOOKS_PER_PAGE;
  htmlElements.dataListButton.innerHTML = `
    <span>Show more</span>
    <span class="list__remaining"> (${Math.max(
      result.length - BOOKS_PER_PAGE,
      0
    )})</span>
  `;

  htmlElements.dataListMessage.classList.toggle(
    "list__message_show",
    result.length === 0
  );
}