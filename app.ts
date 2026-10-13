
// Product Inventory Manager
// TypeScript source code

// 1. INTERFACE
// Defines the structure of a product.
interface Product {
    id: number;
    name: string;
    category: string;
    price: number;
    quantity: number;
}

// 2. BASIC TYPES AND SCOPE
const LOW_STOCK_LIMIT: number = 5;
const STORAGE_KEY: string = "product-inventory-manager-products";

let products: Product[] = loadProducts();

let nextId: number = products.reduce(
    (largestId: number, product: Product) =>
        Math.max(largestId, product.id),
    0
) + 1;

// 3. LOAD PRODUCTS FROM BROWSER STORAGE
function loadProducts(): Product[] {
    const savedData: string | null =
        localStorage.getItem(STORAGE_KEY);

    if (savedData === null) {
        return [];
    }

    try {
        const parsedData: unknown = JSON.parse(savedData);

        return Array.isArray(parsedData)
            ? parsedData as Product[]
            : [];
    } catch {
        return [];
    }
}

// 4. SAVE PRODUCTS
function saveProducts(): void {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(products)
    );
}

// 5. FORMAT PRICE
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(amount);
}

// 6. CHECK STOCK STATUS
function getStockStatus(
    quantity: number
): { label: string; className: string } {

    if (quantity === 0) {
        return {
            label: "Out of stock",
            className: "out-stock"
        };
    }

    if (quantity <= LOW_STOCK_LIMIT) {
        return {
            label: "Low stock",
            className: "low-stock"
        };
    }

    return {
        label: "In stock",
        className: "in-stock"
    };
}

// 7. UPDATE DASHBOARD SUMMARY
function updateSummary(): void {

    const totalUnits: number = products.reduce(
        (sum: number, product: Product) =>
            sum + product.quantity,
        0
    );

    const inventoryValue: number = products.reduce(
        (sum: number, product: Product) =>
            sum + product.price * product.quantity,
        0
    );

    const lowStockCount: number = products.filter(
        (product: Product) =>
            product.quantity <= LOW_STOCK_LIMIT
    ).length;

    document.getElementById("total-products")!.textContent =
        String(products.length);

    document.getElementById("total-units")!.textContent =
        String(totalUnits);

    document.getElementById("inventory-value")!.textContent =
        formatCurrency(inventoryValue);

    document.getElementById("low-stock-count")!.textContent =
        String(lowStockCount);
}

// 8. SAFELY DISPLAY TEXT
function escapeHtml(value: string): string {
    const element: HTMLSpanElement =
        document.createElement("span");

    element.textContent = value;

    return element.innerHTML;
}

// 9. DISPLAY PRODUCTS IN THE TABLE
function renderProducts(searchTerm: string = ""): void {

    const tableBody: HTMLElement =
        document.getElementById("product-table-body")!;

    const emptyState: HTMLElement =
        document.getElementById("empty-state")!;

    const resultCount: HTMLElement =
        document.getElementById("result-count")!;

    const normalizedSearch: string =
        searchTerm.trim().toLowerCase();

    const visibleProducts: Product[] = products.filter(
        (product: Product) =>
            product.name.toLowerCase().includes(normalizedSearch) ||
            product.category.toLowerCase().includes(normalizedSearch)
    );

    tableBody.innerHTML = "";

    visibleProducts.forEach((product: Product) => {

        const status = getStockStatus(product.quantity);

        const row: HTMLTableRowElement =
            document.createElement("tr");

        row.innerHTML = `
            <td>
                <div class="product-cell">
                    <span class="product-icon">📦</span>
                    <span>${escapeHtml(product.name)}</span>
                </div>
            </td>

            <td>${escapeHtml(product.category)}</td>
            <td>${formatCurrency(product.price)}</td>
            <td>${product.quantity}</td>

            <td>
                <span class="stock-badge ${status.className}">
                    ${status.label}
                </span>
            </td>

            <td>
                <strong>
                    ${formatCurrency(product.price * product.quantity)}
                </strong>
            </td>

            <td>
                <button
                    class="delete-button"
                    type="button"
                    data-delete-id="${product.id}">
                    Delete
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });

    emptyState.classList.toggle(
        "visible",
        visibleProducts.length === 0
    );

    resultCount.textContent =
        `${visibleProducts.length} product` +
        `${visibleProducts.length === 1 ? "" : "s"}`;

    updateSummary();
}

// 10. ADD A PRODUCT
function addProduct(
    name: string,
    category: string,
    price: number,
    quantity: number
): void {

    const newProduct: Product = {
        id: nextId,
        name: name,
        category: category,
        price: price,
        quantity: quantity
    };

    nextId++;

    products.push(newProduct);

    saveProducts();

    const searchInput =
        document.getElementById("search-input") as HTMLInputElement;

    renderProducts(searchInput.value);
}

// 11. DELETE A PRODUCT
function deleteProduct(id: number): void {

    products = products.filter(
        (product: Product) => product.id !== id
    );

    saveProducts();

    const searchInput =
        document.getElementById("search-input") as HTMLInputElement;

    renderProducts(searchInput.value);
}

// 12. CLEAR ALL PRODUCTS
function clearAllProducts(): void {

    if (products.length === 0) {
        return;
    }

    const confirmed: boolean = window.confirm(
        "Delete all products from your inventory?"
    );

    if (!confirmed) {
        return;
    }

    products = [];

    saveProducts();

    renderProducts();
}

// 13. CONNECT THE PRODUCT FORM
const productForm =
    document.getElementById("product-form") as HTMLFormElement;

const formMessage =
    document.getElementById("form-message")!;

productForm.addEventListener(
    "submit",
    (event: SubmitEvent): void => {

        event.preventDefault();

        const name = (
            document.getElementById("product-name")
            as HTMLInputElement
        ).value.trim();

        const category = (
            document.getElementById("product-category")
            as HTMLInputElement
        ).value.trim();

        const price = Number((
            document.getElementById("product-price")
            as HTMLInputElement
        ).value);

        const quantity = Number((
            document.getElementById("product-quantity")
            as HTMLInputElement
        ).value);

        if (
            !name ||
            !category ||
            !Number.isFinite(price) ||
            price <= 0 ||
            !Number.isInteger(quantity) ||
            quantity < 0
        ) {
            formMessage.textContent =
                "Enter valid product details.";

            formMessage.style.color = "#b42323";

            return;
        }

        addProduct(name, category, price, quantity);

        productForm.reset();

        formMessage.textContent =
            "Product added successfully.";

        formMessage.style.color = "#16845f";
    }
);

// 14. SEARCH PRODUCTS
const searchInput =
    document.getElementById("search-input") as HTMLInputElement;

searchInput.addEventListener("input", (): void => {
    renderProducts(searchInput.value);
});

// 15. HANDLE DELETE BUTTON CLICKS
document.getElementById("product-table-body")!
    .addEventListener("click", (event: Event): void => {

        const target = event.target as HTMLElement;
        const deleteId = target.dataset.deleteId;

        if (deleteId !== undefined) {
            deleteProduct(Number(deleteId));
        }
    });

// 16. CLEAR ALL BUTTON
document.getElementById("clear-all-button")!
    .addEventListener("click", clearAllProducts);

// 17. INITIAL DISPLAY
renderProducts();
