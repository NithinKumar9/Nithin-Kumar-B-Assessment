const claimData = {
    workerName: "Madeleine Willson",
    claimNo: "20042047",
    workerAppId: "712041",
};

const prescriptionDrugs = [
    {
        drugName: "Naproxen",
        prescriptionDate: "February 28, 2024",
        datePurchased: "February 29, 2024",
        healthcareProvider: "Dr. Best",
        paidAmount: "$20.00"
    }
];

const otcDrugs = [
    {
        drugName: "Advil",
        datePurchased: "March 28, 2024",
        paidAmount: "$8.00",
        sellerName: "Shoppers Drug Mart",
        reason: "Pain"
    }
];

const medicalSupplies = [
    {
        itemPurchased: "Tensor",
        datePurchased: "February 28, 2024",
        wasPrescribed: "Yes",
        healthcareProvider: "Dr. Best",
        paidAmount: "$10.00",
        sellerName: "Shoppers Drug Mart"
    },
    {
        itemPurchased: "Dasatin",
        datePurchased: "July 21, 2026",
        wasPrescribed: "Yes",
        healthcareProvider: "Dr. Jay",
        paidAmount: "$10.00",
        sellerName: "Shoppers Drug Mart"
    }
];

const parkingData = [
    {
        address: "333 St Mary Ave, Winnipeg MB R3C4A5, Canada",
        date: "March 28, 2024",
        paidAmount: "$10.00",
        meterUsed: "Yes",
        meterNumber: "12245"
    }
];

const mileageData = [
    {
        appointmentDate: "March 28, 2024",
        healthcareAddress: "HSC, 820 Sherbrook St, Winnipeg MB R3A 1R9, Canada",
        workplaceAddress: "WCB, 333 Broadway, Winnipeg MB R3C 4W3, Canada",
        kilometers: "20 km"
    }
];

const faresData = [
    {
        appointmentDate: "March 28, 2024",
        startingAddress: "HSC Winnipeg Women's Hospital, 665 William Ave, Winnipeg MB R3E 0Z2, Canada",
        healthcareAddress: "HSC Winnipeg Women's Hospital, 665 William Ave, Winnipeg MB R3E 0Z2, Canada",
        type: "Bus",
        farePaid: "$3.00"
    },
    {
        appointmentDate: "March 27, 2024",
        startingAddress: "25 Furby St, Winnipeg MB R3C2A2, Canada",
        healthcareAddress: "440 Edmonton St, Winnipeg MB R3B 2M4, Canada",
        type: "Taxi",
        farePaid: "$15.00"
    },
    {
        appointmentDate: "July 20, 2024",
        startingAddress: "Bengaluru",
        healthcareAddress: "Banglore, Karanataka",
        type: "Bus",
        farePaid: "$9.00"
    }
    
];

function getCurrentDateTimeFormatted() {
    const now = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    
    const month = months[now.getMonth()];
    const day = now.getDate();
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${month} ${day}, ${year} ${hours}:${minutes}`;
}



function populateTable(tableId, data, columns) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = ""; 
    
    data.forEach(item => {
        const row = document.createElement("tr");
        columns.forEach(col => {
            const cell = document.createElement("td");
            cell.textContent = item[col] || "";
            row.appendChild(cell);
        });
        tbody.appendChild(row);
    });
}

function populateAllTables() {
    populateTable("prescriptionTable", prescriptionDrugs, 
        ["drugName", "prescriptionDate", "datePurchased", "healthcareProvider", "paidAmount"]);
    
    populateTable("otcTable", otcDrugs, 
        ["drugName", "datePurchased", "paidAmount", "sellerName", "reason"]);
    
    populateTable("suppliesTable", medicalSupplies, 
        ["itemPurchased", "datePurchased", "wasPrescribed", "healthcareProvider", "paidAmount", "sellerName"]);
    
    populateTable("parkingTable", parkingData, 
        ["address", "date", "paidAmount", "meterUsed", "meterNumber"]);
    
    populateTable("mileageTable", mileageData, 
        ["appointmentDate", "healthcareAddress", "workplaceAddress", "kilometers"]);
    
    populateTable("faresTable", faresData, 
        ["appointmentDate", "startingAddress", "healthcareAddress", "type", "farePaid"]);
}

function populateHeader() {
    const currentDateTime = getCurrentDateTimeFormatted();
    claimData.submittedDate = currentDateTime;
    
    document.getElementById("workerName").innerHTML = 
        `<span class="worker-name-blue">${claimData.workerName}</span> requested reimbursement for the following medical and/or travel expenses:`;
    document.getElementById("claimNo").textContent = claimData.claimNo;
    document.getElementById("workerAppId").textContent = claimData.workerAppId;
    document.getElementById("submittedDate").textContent = claimData.submittedDate;
}

document.addEventListener("DOMContentLoaded", function() {
    populateHeader();
    populateAllTables();
});

window.addEventListener("beforeprint", function() {
    const currentDateTime = getCurrentDateTimeFormatted();
    document.getElementById("submittedDate").textContent = currentDateTime;
});

window.addEventListener("afterprint", function() {
    const currentDateTime = getCurrentDateTimeFormatted();
    document.getElementById("submittedDate").textContent = currentDateTime;
});
