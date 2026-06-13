// قائمة الوجبات الافتراضية للمطعم
const defaultProducts = [
    { id: 1, name: "برغر لحم ملكي", price: 450.00, category: "fastfood", icon: "fa-hamburger" },
    { id: 2, name: "بيتزا ميكس فُورماج", price: 650.00, category: "fastfood", icon: "fa-pizza-slice" },
    { id: 3, name: "ساندويش شاورما دجاج", price: 300.00, category: "fastfood", icon: "fa-hotdog" },
    { id: 4, name: "تارت الشوكولاتة الفاخرة", price: 250.00, category: "sweets", icon: "fa-cookie" },
    { id: 5, name: "قطعة تشيز كيك كرز", price: 350.00, category: "sweets", icon: "fa-ice-cream" },
    { id: 6, name: "عصير برتقال طبيعي", price: 180.00, category: "drinks", icon: "fa-glass-water" },
    { id: 7, name: "كابوتشينو / إسبريسو", price: 150.00, category: "drinks", icon: "fa-mug-hot" }
];

// تحميل المخزون والتقارير المالية التراكمية من الخزنة المحلية المتصفح (LocalStorage)
let products = JSON.parse(localStorage.getItem("restaurant_inventory")) || defaultProducts;
let totalEarnings = parseFloat(localStorage.getItem("restaurant_total_earnings")) || 0.00;
let completedOrdersCount = parseInt(localStorage.getItem("restaurant_orders_count")) || 0;

let cart = [];
let currentOrderTotalTemp = 0; // متغيّر لحجز قيمة الطلب النشط حالياً مؤقتاً لحين إنهاء المعاملة

function updateDashboardUI() {
    document.getElementById("totalEarnings").textContent = `${totalEarnings.toFixed(2)} د.ج`;
    document.getElementById("completedOrdersCount").textContent = completedOrdersCount;
}

function resetEarnings() {
    if (confirm("تحذير محاسبي: هل أنت متأكد من تصفير كافة الأرباح وإحصائيات المبيعات المسجلة بالكامل؟")) {
        totalEarnings = 0.00;
        completedOrdersCount = 0;
        localStorage.setItem("restaurant_total_earnings", totalEarnings);
        localStorage.setItem("restaurant_orders_count", completedOrdersCount);
        updateDashboardUI();
    }
}

function saveInventoryToStorage() {
    localStorage.setItem("restaurant_inventory", JSON.stringify(products));
}

function addNewProduct() {
    const nameInput = document.getElementById("newProductName");
    const priceInput = document.getElementById("newProductPrice");
    const categoryInput = document.getElementById("newProductCategory");

    const name = nameInput.value.trim();
    const price = parseFloat(priceInput.value);
    const category = categoryInput.value;

    if (!name || isNaN(price) || price <= 0) {
        alert("الرجاء إدخال اسم الأكلة وتحديد سعر صحيح أكبر من الصفر!");
        return;
    }

    let icon = "fa-utensils"; 
    if (category === "fastfood") icon = "fa-hamburger";
    if (category === "sweets") icon = "fa-cookie";
    if (category === "drinks") icon = "fa-glass-water";

    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    products.push({ id: newId, name, price, category, icon });
    
    saveInventoryToStorage();
    displayMenu();
    
    nameInput.value = "";
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

// 1. دالة الدفع الصافية وحفظ المعاملة (تُعرض فقط على الشاشة ولا تطبع تلقائياً)
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

// 2. دالة الطباعة الحقيقية المستقلة تماماً (تُستدعى بناءً على رغبة الكاشير فقط)
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
        closeInvoice(); // إنهاء الطلب وتصفير السلة تلقائياً بعد خروج الفاتورة
    }, 500);
}

// دالة الطباعة الفورية المباشرة من لوحة التحكم الجانبية (دون المرور بالنافذة المنبثقة)
function directPrint() {
    if (cart.length === 0) {
        alert("السلة فارغة، لا يوجد شيء لطباعته!");
        return;
    }
    checkoutOrder();     // تجهيز البيانات وبناء الإيصال أولاً
    printRealInvoice();   // تفعيل محرك الطابعة فورا
}

// ترحيل الأرباح الصافية رسمياً وتصفير سلة الكاشير
function closeInvoice() {
    document.getElementById("invoiceModal").style.display = "none";
    
    if (currentOrderTotalTemp > 0) {
        totalEarnings += currentOrderTotalTemp;
        completedOrdersCount += 1;
        
        localStorage.setItem("restaurant_total_earnings", totalEarnings);
        localStorage.setItem("restaurant_orders_count", completedOrdersCount);
        
        updateDashboardUI();
        currentOrderTotalTemp = 0;
    }

    cart = [];
    updateCartUI();
}

// التشغيل الأولي للمشروع
displayMenu();
updateDashboardUI();