document.addEventListener("DOMContentLoaded", () => {
  // Set default date to today
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("invoiceDate").value = today;

  // Add one empty item by default
  addItem();

  // Event listeners
  document.getElementById("addItemBtn").addEventListener("click", addItem);
  document.getElementById("generateQRBtn").addEventListener("click", generateQRCode);
  document.getElementById("printBtn").addEventListener("click", printInvoice);
  document.getElementById("pdfBtn").addEventListener("click", exportToPDF);

  // Initialize calculations
  calculateTotals();
});

// Counter for item IDs
let itemCounter = 0;

// Add a new item row
function addItem() {
  itemCounter++;
  const tbody = document.getElementById("invoiceItems");
  const tr = document.createElement("tr");
  tr.dataset.id = itemCounter;

  tr.innerHTML = `
        <td>${itemCounter}</td>
        <td>
            <textarea class="item-description" placeholder="Item description" oninput="autoResize(this)"></textarea>
        </td>
        <td>
            <input type="number" class="item-quantity text-center" value="1" min="0" onchange="updateItemAmount(${itemCounter})">
        </td>
        <td>
            <input type="number" class="item-price text-center" value="0" min="0" step="0.01" onchange="updateItemAmount(${itemCounter})">
        </td>
        <td>
            <input type="number" class="item-amount text-center" value="0.00" readonly>
        </td>
        <td class="text-center no-print">
            <button class="btn btn-danger btn-sm" onclick="removeItem(${itemCounter})">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
        </td>
    `;

  tbody.appendChild(tr);
  updateItemAmount(itemCounter);
}

// Function to auto-resize textarea
function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}

// Remove an item row
function removeItem(id) {
  const tbody = document.getElementById("invoiceItems");
  const rows = tbody.getElementsByTagName("tr");

  // Don't remove if it's the last row
  if (rows.length <= 1) return;

  // Find and remove the row
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].dataset.id == id) {
      rows[i].remove();
      break;
    }
  }

  // Renumber the rows
  renumberRows();

  // Recalculate totals
  calculateTotals();
}

// Renumber the rows after deletion
function renumberRows() {
  const tbody = document.getElementById("invoiceItems");
  const rows = tbody.getElementsByTagName("tr");

  for (let i = 0; i < rows.length; i++) {
    rows[i].cells[0].textContent = i + 1;
  }
}

// Update the amount for an item
function updateItemAmount(id) {
  const row = document.querySelector(`tr[data-id="${id}"]`);
  if (!row) return;

  const quantity = Number.parseFloat(row.querySelector(".item-quantity").value) || 0;
  const price = Number.parseFloat(row.querySelector(".item-price").value) || 0;
  const amount = quantity * price;

  row.querySelector(".item-amount").value = amount.toFixed(2);

  calculateTotals();
}

// Calculate subtotal, VAT, and total
function calculateTotals() {
  let subtotal = 0;

  // Sum up all item amounts
  document.querySelectorAll(".item-amount").forEach((input) => {
    subtotal += Number.parseFloat(input.value) || 0;
  });

  const vat = subtotal * 0.15;
  const total = subtotal + vat;

  // Update the display
  document.getElementById("subtotal").textContent = subtotal.toFixed(2);
  document.getElementById("vat").textContent = vat.toFixed(2);
  document.getElementById("total").textContent = total.toFixed(2);
}



// TLV encoding for QR code
function encodeTLV(tag, value) {
  const encodedTag = String.fromCharCode(tag);
  const encodedLength = String.fromCharCode(value.length);
  return encodedTag + encodedLength + value;
}

// Generate QR code
function generateQRCode() {
  const sellerName = document.getElementById("sellerSelect").value;
  const vatNumber = document.getElementById("vatNumber").value;
  const invoiceDate = document.getElementById("invoiceDate").value;
  const total = document.getElementById("total").textContent;
  const vat = document.getElementById("vat").textContent;

  const tlvData =
    encodeTLV(1, sellerName) +
    encodeTLV(2, vatNumber) +
    encodeTLV(3, invoiceDate) +
    encodeTLV(4, total) +
    encodeTLV(5, vat);

  const base64TLV = btoa(tlvData);

  // Generate QR code using QRious
  const qrCode = new QRious({
    element: document.getElementById("qrCode"),
    value: base64TLV,
    size: 200,
  });
}

// Print invoice
function printInvoice() {
  window.print();
}

// Export to PDF
function exportToPDF() {
  const invoiceNumber = document.getElementById("invoiceNumber").value || "Invoice";
  const element = document.getElementById("invoice");

  const noPrintElements = element.querySelectorAll(".no-print");
  noPrintElements.forEach(el => el.style.display = "none");

  const buttons = element.querySelectorAll(".btn-outline, .btn-danger");
  buttons.forEach(button => button.style.visibility = "hidden");


  const inputs = element.querySelectorAll("input, select, textarea");
  inputs.forEach(input => input.style.border = "none");


  const tableCells = element.querySelectorAll("td, th");
  tableCells.forEach(cell => cell.style.border = "1px solid var(--border)");


  const numberInputs = element.querySelectorAll('input[type="number"]');
  numberInputs.forEach(input => {
    input.style.appearance = "textfield";
  });


  const textareas = element.querySelectorAll("textarea");
  const replacements = [];
  textareas.forEach(textarea => {
    const div = document.createElement("div");
    div.textContent = textarea.value;
    div.style.cssText = `
      white-space: pre-wrap;
      word-wrap: break-word;
      width: ${textarea.offsetWidth}px;
      min-height: ${textarea.scrollHeight}px;
      border: none;
      padding: 0.5rem;
      font-size: 0.875rem;
      background-color: var(--background);
      color: var(--foreground);
    `;
    textarea.style.display = "none"; // Hide textarea
    textarea.parentNode.insertBefore(div, textarea);
    replacements.push({ textarea, div });
  });


  html2canvas(element, {
    scale: 2,
    useCORS: true,
    windowWidth: document.documentElement.scrollWidth,
    windowHeight: document.documentElement.scrollHeight
  }).then(canvas => {
    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;


    let heightLeft = pdfHeight;
    let position = 0;

    while (heightLeft > 0) {
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
      position -= pdf.internal.pageSize.getHeight();
      if (heightLeft > 0) {
        pdf.addPage();
      }
    }

    pdf.save(`${invoiceNumber}.pdf`);

  
    buttons.forEach(button => button.style.visibility = "visible");
    inputs.forEach(input => input.style.border = "");
    tableCells.forEach(cell => cell.style.border = "");
    numberInputs.forEach(input => input.style.appearance = "");

    noPrintElements.forEach(el => el.style.display = "");

    replacements.forEach(({ textarea, div }) => {
      textarea.style.display = "";
      div.remove();
    });
  });
}


// ---------------head Logo------------

const logoDiv = document.getElementById("logo");
const logoImg = document.getElementById("logoImg");

// Function to load saved image from LocalStorage
function loadSavedLogo() {
  const savedLogo = localStorage.getItem("logoImage");
  if (savedLogo) {
    logoImg.src = savedLogo;
    logoImg.style.display = "block"; // Show saved image
    logoDiv.querySelector("span").style.display = "none"; // Hide text
  }
}

// Load saved logo on page load
window.onload = loadSavedLogo;

// Drag & Drop events
logoDiv.addEventListener("dragover", (e) => {
  e.preventDefault();
  logoDiv.style.borderColor = "blue";
});

logoDiv.addEventListener("dragleave", () => {
  logoDiv.style.borderColor = "#ccc";
});

logoDiv.addEventListener("drop", (e) => {
  e.preventDefault();
  logoDiv.style.borderColor = "#ccc";

  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = function(event) {
      const imageData = event.target.result;
      logoImg.src = imageData;
      logoImg.style.display = "block";
      logoDiv.querySelector("span").style.display = "none";

      // Save image in LocalStorage
      localStorage.setItem("logoImage", imageData);
    };
    reader.readAsDataURL(file);
  } else {
    alert("Please drop a valid image file.");
  }
});


// ---------File Share PDF-------------//
async function exportAndSend() {
  try {
    const invoiceElement = document.getElementById("invoice");
    const invoiceNumber =
      document.getElementById("invoiceNumber")?.value || "Invoice";

    // Hide no-print elements
    const noPrintElements = invoiceElement.querySelectorAll(".no-print");
    noPrintElements.forEach((el) => (el.style.display = "none"));

    // Hide buttons
    const buttons = invoiceElement.querySelectorAll(
      ".btn-outline, .btn-danger"
    );
    buttons.forEach((button) => (button.style.visibility = "hidden"));

    // Convert textareas to divs
    const textareas = invoiceElement.querySelectorAll("textarea");
    const replacements = [];
    textareas.forEach((textarea) => {
      const div = document.createElement("div");
      div.textContent = textarea.value;
      div.style.cssText = `white-space: pre-wrap; word-wrap: break-word; width: ${textarea.offsetWidth}px; min-height: ${textarea.scrollHeight}px;`;
      textarea.style.display = "none";
      textarea.parentNode.insertBefore(div, textarea);
      replacements.push({ textarea, div });
    });

    // Generate PDF using html2canvas and jsPDF
    const canvas = await html2canvas(invoiceElement, {
      scale: 1.5,
      useCORS: true,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jspdf.jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    // Convert PDF to Blob
    const pdfBlob = pdf.output("blob");
    const pdfFile = new File([pdfBlob], `${invoiceNumber}.pdf`, {
      type: "application/pdf",
    });

    // Restore original UI state
    buttons.forEach((button) => (button.style.visibility = "visible"));
    noPrintElements.forEach((el) => (el.style.display = ""));
    replacements.forEach(({ textarea, div }) => {
      textarea.style.display = "";
      div.remove();
    });

    // Web Share API (Mobile Support)
    if (navigator.share && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({
        title: "Invoice",
        text: "Here is your invoice:",
        files: [pdfFile],
      });
    } else {
      // Fallback: Generate WhatsApp Web Link
      const pdfUrl = URL.createObjectURL(pdfFile);
      const message = encodeURIComponent("Here's your invoice:");
      window.open(
        `https://web.whatsapp.com/send?text=${message}%0a${pdfUrl}`,
        "_blank"
      );

      // Fallback: Allow manual download
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `${invoiceNumber}.pdf`;
      link.click();
      alert("PDF downloaded. Please attach it to WhatsApp manually.");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Error exporting or sharing invoice. Please try again.");
  }
}
