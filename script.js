// Variables
const cartBtn = document.querySelector(".cart-btn");
const clearCartBtn = document.querySelector(".btn-clear");
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".total-value");
const cartContent = document.querySelector(".cart-list");
const productsDOM = document.querySelector("#products-dom");

let cart = [];
let buttonsDOM = [];

// Pixabay API Key
const API_KEY = '45940650-d42238c83bda7420b18c7fcbe';

// Function to fetch book images from Pixabay API
async function getBookImages() {
    try {
        let result = await fetch(`https://pixabay.com/api/?key=${API_KEY}&q=books&image_type=photo&per_page=10`);
        let data = await result.json();
        return data.hits;  // Images are inside the hits array
    } catch (error) {
        console.error(error);
    }
}

class Products {
    // Fetch product data and book images
    async getProducts() {
        try {
            // Fetch product data from Mock API
            let result = await fetch("https://66e029502fb67ac16f2895b2.mockapi.io/products");
            let data = await result.json();

            // Fetch book images from Pixabay API
            let bookImages = await getBookImages();

            // Map book images to the products
            data = data.map((product, index) => {
                product.image = bookImages[index % bookImages.length].webformatURL; // Assign an image to each product
                return product;
            });

            return data;

        } catch (error) {
            console.error(error);
        }
    }
}

class UI {
    // Display products in the UI
    displayProducts(products) {
        let result = "";
        products.forEach(item => {
            result += `
            <div class="col-lg-4 col-md-6">
                <div class="product">
                    <div class="product-image">
                        <img src="${item.image}" alt="product" class="img-fluid">   
                    </div>
                    <div class="product-hover">
                        <span class="product-title">${item.title}</span>
                        <span class="product-price">$ ${item.price}</span>
                        <button class="btn-add-to-cart" data-id="${item.id}">
                            <i class="fas fa-cart-shopping"></i>
                        </button>  
                    </div>
                </div>
            </div>
            `;
        });
        productsDOM.innerHTML = result;
    }

    // Get "Add to Cart" buttons and handle cart logic
    getBagButtons() {
        buttonsDOM = [...document.querySelectorAll(".btn-add-to-cart")];
        buttonsDOM.forEach(button => {
            let id = button.dataset.id;
            let inCart = cart.find(item => item.id === id);
            if (inCart) {
                button.setAttribute("disabled", "disabled");
                button.style.opacity = ".3";
            } else {
                button.addEventListener("click", event => {
                    event.target.disabled = true;
                    event.target.style.opacity = ".3";

                    // Get product from local storage
                    let cartItem = { ...Storage.getProducts(id), amount: 1 };

                    // Add product to the cart
                    cart = [...cart, cartItem];

                    // Save cart in local storage
                    Storage.saveCart(cart);

                    // Update cart values (total price and number of items)
                    this.saveCartValues(cart);

                    // Display the cart item in the UI
                    this.addCartItem(cartItem);

                    // Show the cart
                    this.showCart();
                });
            }
        });
    }

    // Save total price and number of items in the cart
    saveCartValues(cart) {
        let tempTotal = 0;
        let itemsTotal = 0;
        cart.forEach(item => {
            tempTotal += item.price * item.amount;
            itemsTotal += item.amount;
        });

        cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
        cartItems.innerText = itemsTotal;
    }

    // Add cart item to the cart content in the UI
    addCartItem(item) {
        const li = document.createElement("li");
        li.classList.add("cart-list-item");
        li.innerHTML = `
            <div class="cart-left">
                <div class="cart-left-image">
                    <img src="${item.image}" alt="product" class="img-fluid"/>
                </div>
                <div class="cart-left-info">
                    <a class="cart-left-info-title" href="#">${item.title}</a>
                    <span class="cart-left-info-price">$ ${item.price}</span>
                </div>   
            </div>
            <div class="cart-right">
                <div class="cart-right-quantity">
                    <button class="quantity-minus" data-id="${item.id}">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="quantity">${item.amount}</span>
                    <button class="quantity-plus" data-id="${item.id}">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="cart-right-remove">
                    <button class="cart-remove-btn" data-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        cartContent.appendChild(li);
    }

    // Show the cart
    showCart() {
        cartBtn.click();
    }

    // Set up the application when the page loads
    setupApp() {
        cart = Storage.getCart();
        this.saveCartValues(cart);
        this.populateCart(cart);
        this.getBagButtons();
        this.cartLogic();
    }

    // Populate the cart with saved items from local storage
    populateCart(cart) {
        cart.forEach(item => this.addCartItem(item));
    }

    // Handle cart logic like removing items and adjusting quantities
    cartLogic() {
        clearCartBtn.addEventListener("click", () => {
            this.clearCart();
        });

        cartContent.addEventListener("click", event => {
            if (event.target.classList.contains("cart-remove-btn")) {
                let removeItem = event.target;
                let id = removeItem.dataset.id;
                removeItem.parentElement.parentElement.parentElement.remove();
                this.removeItem(id);
            } else if (event.target.classList.contains("quantity-minus")) {
                let lowerAmount = event.target;
                let id = lowerAmount.dataset.id;
                let tempItem = cart.find(item => item.id === id);
                tempItem.amount -= 1;
                if (tempItem.amount > 0) {
                    Storage.saveCart(cart);
                    this.saveCartValues(cart);
                    lowerAmount.nextElementSibling.innerText = tempItem.amount;
                } else {
                    lowerAmount.parentElement.parentElement.parentElement.remove();
                    this.removeItem(id);
                }
            } else if (event.target.classList.contains("quantity-plus")) {
                let addAmount = event.target;
                let id = addAmount.dataset.id;
                let tempItem = cart.find(item => item.id === id);
                tempItem.amount += 1;
                Storage.saveCart(cart);
                this.saveCartValues(cart);
                addAmount.previousElementSibling.innerText = tempItem.amount;
            }
        });
    }

    // Clear the entire cart
    clearCart() {
        cart.forEach(item => this.removeItem(item.id));
        while (cartContent.firstChild) {
            cartContent.removeChild(cartContent.firstChild);
        }
        this.saveCartValues(cart);
    }

    // Remove a single item from the cart
    removeItem(id) {
        cart = cart.filter(item => item.id !== id);
        this.saveCartValues(cart);
        Storage.saveCart(cart);
        let button = this.getSingleButton(id);
        if (button) {
            button.disabled = false;
            button.style.opacity = "1";
        }
    }

    // Get the button associated with a product by its ID
    getSingleButton(id) {
        return buttonsDOM.find(button => button.dataset.id === id);
    }
}

class Storage {
    // Save products to local storage
    static saveProducts(products) {
        localStorage.setItem("products", JSON.stringify(products));
    }

    // Get a single product by its ID from local storage
    static getProducts(id) {
        let products = JSON.parse(localStorage.getItem("products"));
        return products ? products.find(product => product.id === id) : null;
    }

    // Save the cart to local storage
    static saveCart(cart) {
        localStorage.setItem("cart", JSON.stringify(cart));
    }

    // Get the cart from local storage
    static getCart() {
        return localStorage.getItem("cart") ? JSON.parse(localStorage.getItem("cart")) : [];
    }
}

// When the DOM is fully loaded, set up the app and fetch products
document.addEventListener("DOMContentLoaded", () => {
    const ui = new UI();
    const products = new Products();

    ui.setupApp();

    products.getProducts().then(products => {
        ui.displayProducts(products);
        Storage.saveProducts(products);
    }).then(() => {
        ui.getBagButtons();
        ui.cartLogic();
    });
});
