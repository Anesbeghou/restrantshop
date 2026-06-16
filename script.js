// قائمة الوجبات الافتراضية للمطعم مع إضافة التكلفة المحسوبة
const defaultProducts = [
    { id: 1, name: "برغر لحم ملكي", price: 450.00, cost: 250.00, category: "fastfood", icon: "fa-hamburger" },
    { id: 2, name: "بيتزا ميكس فُورماج", price: 650.00, cost: 380.00, category: "fastfood", icon: "fa-pizza-slice" },
    { id: 3, name: "ساندويش شاورما دجاج", price: 300.00, cost: 160.00, category: "fastfood", icon: "fa-hotdog" },
    { id: 4, name: "تارت الشوكولاتة الفاخرة", price: 250.00, cost: 120.00, category: "sweets", icon: "fa-cookie" },
    { id: 5, name: "قطعة تشيز كيك كرز", price: 350.00, cost: 180.00, category: "sweets", icon: "fa-ice-cream" },
    { id: 6, name: "عصير برتقال طبيعي", price: 180.00, cost: 70.00, category: "drinks", icon: "fa-glass-water" },
    { id: 7, name: "كابوتشينو / إسبريسو", price: 150.00, cost: 50.00, category: "drinks", icon: "fa-mug-hot" }
];

// المتغيرات العامة
let products = [];
let totalEarnings = 0.00;
let completedOrdersCount = 0;
let cart = [];
let currentOrderTotalTemp = 0; 
let db;

// ----------------------------------------------------
// إعداد وتهيئة قاعدة بيانات IndexedDB
// ----------------------------------------------------
const request = indexedDB.open("RestaurantDB", 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    if (!db.objectStoreNames.contains("inventory")) {
        db.createObjectStore("inventory", { keyPath: "id" });
    }
    if (!db.objectStoreNames.contains("stats")) {
        db.createObjectStore("stats", { keyPath: "id" });
    }
};

request.onsuccess = function(event) {
    db = event.target.result;
    loadDataFromDB(); 
};

request.onerror = function(event) {
    console.error("خطأ في فتح قاعدة البيانات IndexedDB:", event);
};

function loadDataFromDB() {
    const tx = db.transaction(["inventory", "stats"], "readonly");
    const inventoryStore = tx.objectStore("inventory");
    const statsStore = tx.objectStore("stats");

    const getInventory = inventoryStore.getAll();
    const getEarnings = statsStore.get("totalEarnings");
    const getOrders = statsStore.get("completedOrdersCount");

    tx.oncomplete = function() {
        if (getInventory.result && getInventory.result.length > 0) {
            products = getInventory.result;
        } else {
            products = [...defaultProducts];
            saveInventoryToStorage(); 
        }

        totalEarnings = getEarnings.result ? getEarnings.result.value : 0.00;
        completedOrdersCount = getOrders.result ? getOrders.result.value : 0;

        displayMenu();
        updateDashboardUI();
    };
}

function saveInventoryToStorage() {
    const tx = db.transaction("inventory", "readwrite");
    const store = tx.objectStore("inventory");
    store.clear(); 
    products.forEach(p => store.put(p));
}

function saveStatsToStorage() {
    const tx = db.transaction("stats", "readwrite");
    const store = tx.objectStore("stats");
    store.put({ id: "totalEarnings", value: totalEarnings });
    store.put({ id: "completedOrdersCount", value: completedOrdersCount });
}

// ----------------------------------------------------
// دوال النظام المحدثة
// ----------------------------------------------------
function updateDashboardUI() {
    document.getElementById("totalEarnings").textContent = `${totalEarnings.toFixed(2)} د.ج`;
    document.getElementById("completedOrdersCount").textContent = completedOrdersCount;
}

function resetEarnings() {
    if (confirm("تحذير محاسبي: هل أنت متأكد من تصفير كافة الأرباح وإحصائيات المبيعات المسجلة بالكامل؟")) {
        totalEarnings = 0.00;
        completedOrdersCount = 0;
        saveStatsToStorage(); 
        updateDashboardUI();
    }
}

function addNewProduct() {
    const nameInput = document.getElementById("newProductName");
    const costInput = document.getElementById("newProductCost");
    const priceInput = document.getElementById("newProductPrice");
    const categoryInput = document.getElementById("newProductCategory");

    const name = nameInput.value.trim();
    const cost = parseFloat(costInput.value);
    const price = parseFloat(priceInput.value);
    const category = categoryInput.value;

    // التحقق من صحة المدخلات الرقمية للتكلفة وسعر البيع
    if (!name || isNaN(cost) || cost < 0 || isNaN(price) || price <= 0) {
        alert("الرجاء إدخال اسم الأكلة وتحديد تكلفة وسعر بيع صحيحين أكبر من أو يساوي الصفر!");
        return;
    }

    let icon = "fa-utensils"; 
    if (category === "fastfood") icon = "fa-hamburger";
    if (category === "sweets") icon = "fa-cookie";
    if (category === "drinks") icon = "fa-glass-water";

    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    
    // حفظ التكلفة والسعر معاً داخل مصفوفة المنتجات
    products.push({ id: newId, name, cost, price, category, icon });
    
    saveInventoryToStorage(); 
    displayMenu();
    
    nameInput.value = "";
    costInput.value = "";
    priceInput.value = "";
    nameInput.focus();
}

function deleteProductFromMenu(productId, event) {
    event.stopPropagation(); 
    if (confirm("هل أنت متأكد من حذف هذه الوجبة نهائياً من قائمة الطعام؟")) {
        products = products.filter(product => product.id !== productId);
        cart = cart.filter(item => item.id !== productId);
        saveInventoryToStorage(); 
        displayMenu();
        updateCartUI();
    }
}

function displayMenu(categoryFilter = "all") {
    const menuGrid = document.getElementById("menuGrid");
    menuGrid.innerHTML = "";

    products.forEach(product => {
        if (categoryFilter === "all" || product.category === categoryFilter) {
            const card = document.createElement("div");
            card.className = "menu-card";
            card.onclick = () => addToCart(product.id);
            card.innerHTML = `
                <button class="btn-delete-product" onclick="deleteProductFromMenu(${product.id}, event)" title="حذف الوجبة">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
                <div class="card-icon"><i class="fa-solid ${product.icon}"></i></div>
                <div class="card-title">${product.name}</div>
                <div class="card-price">${product.price.toFixed(2)} د.ج</div>
            `;
            menuGrid.appendChild(card);
        }
    });
}

function filterCategory(category) {
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    displayMenu(category);
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    updateCartUI();
}

function changeQuantity(id, delta) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(id);
            return;
        }
    }
    updateCartUI();
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
}

function clearCart() {
    if(confirm("هل أنت متأكد من إلغاء الطلب الحالي وتفريغ الفاتورة؟")) {
        cart = [];
        updateCartUI();
    }
}

function updateCartUI() {
    const tbody = document.getElementById("cartTableBody");
    tbody.innerHTML = "";
    let subtotal = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${item.name}</strong></td>
            <td>
                <div class="qty-controls">
                    <button class="qty-btn" onclick="changeQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" onclick="changeQuantity(${item.id}, 1)">+</button>
                </div>
            </td>
            <td>${itemTotal.toFixed(2)} د.ج</td>
            <td>
                <button class="btn-item-delete" onclick="removeFromCart(${item.id})">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById("subtotalPrice").textContent = `${subtotal.toFixed(2)} د.ج`;
    document.getElementById("grandTotalPrice").textContent = `${subtotal.toFixed(2)} د.ج`;
}

function checkoutOrder() {
    if (cart.length === 0) {
        alert("الفاتورة فارغة! أضف بعض الوجبات أولاً ليتم الدفع.");
        return;
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    currentOrderTotalTemp = subtotal;

    let detailsHTML = `<p style="margin-bottom:10px;">التاريخ: ${new Date().toLocaleDateString('ar-DZ')} | الوقت: ${new Date().toLocaleTimeString('ar-DZ')}</p><hr style="border-top: 1px dashed #ccc; margin-bottom:10px;">`;
    
    cart.forEach(item => {
        detailsHTML += `<div style="display:flex; justify-content:space-between; margin-bottom:5px;">
            <span>${item.name} (x${item.quantity})</span>
            <span>${(item.price * item.quantity).toFixed(2)} د.ج</span>
        </div>`;
    });

    detailsHTML += `<hr style="border-top: 1px dashed #ccc; margin:10px 0;">
    <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:1.1rem; margin-top:5px; color:#e25c1d;">
        <span>الإجمالي النهائي:</span><span>${subtotal.toFixed(2)} د.ج</span>
    </div>`;

    document.getElementById("invoiceDetails").innerHTML = detailsHTML;
    document.getElementById("invoiceModal").style.display = "flex";
}

function printRealInvoice() {
    const invoiceContent = document.getElementById("invoiceDetails").innerHTML;
    const printWindow = window.open('', '', 'height=600,width=400');

    printWindow.document.write('<html><head><title>إيصال طلب</title>');
    printWindow.document.write(`
        <style>
            @page { margin: 0; }
            body { font-family: 'Cairo', sans-serif; direction: rtl; text-align: right; margin: 0; padding: 8mm 5mm; width: 72mm; color: #000; background: #fff; }
            h3, p { text-align: center; margin: 5px 0; }
            hr { border: none; border-top: 1px dashed #000; margin: 10px 0; }
            div { font-size: 0.95rem; }
        </style>
    `);
    printWindow.document.write('</head><body>');
    printWindow.document.write('<h3 style="text-align:center; font-size:1.2rem; font-weight:bold; margin-bottom:2px;">مطعم الوجيز الاحترافي</h3>');
    printWindow.document.write('<p style="text-align:center; font-size:0.85rem; margin-bottom:12px;">إيصال مبيعات كاشير</p>');
    printWindow.document.write(invoiceContent);
    printWindow.document.write('<p style="text-align:center; margin-top:20px; font-size:0.8rem; border-top:1px dashed #000; padding-top:10px;">شكراً لزيارتكم وصحة وعافية!</p>');
    printWindow.document.write('</body></html>');

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
        printWindow.print();
        printWindow.close();
        closeInvoice(); 
    }, 500);
}

function directPrint() {
    if (cart.length === 0) {
        alert("السلة فارغة، لا يوجد شيء لطباعته!");
        return;
    }
    checkoutOrder();     
    printRealInvoice();   
}

function closeInvoice() {
    document.getElementById("invoiceModal").style.display = "none";
    
    if (currentOrderTotalTemp > 0) {
        // حاسبة صافي الأرباح: (سعر البيع - التكلفة) * الكمية لكل عنصر بالسلة
        const netProfit = cart.reduce((sum, item) => {
            const cost = item.cost !== undefined ? item.cost : 0; // حماية في حال وجود منتجات قديمة في المتصفح بدون حقل تكلفة
            return sum + ((item.price - cost) * item.quantity);
        }, 0);

        totalEarnings += netProfit; // إضافة صافي الأرباح فقط للخزينة بدلاً من السعر الكلي
        completedOrdersCount += 1;
        
        saveStatsToStorage(); 
        updateDashboardUI();
        currentOrderTotalTemp = 0;
    }

    cart = [];
    updateCartUI();
}


// تسجيل نظام العمل دون اتصال الديناميكي (Restaurant PWA Active)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('نظام المطعم جاهز للعمل دون اتصال بنجاح!'))
      .catch(err => console.error('خطأ في تسجيل الـ Service Worker:', err));
  });
}
