const iflog = true; // Variável global para controle de logs


const colorPalette = [
    'rgba(255, 99, 132, 0.6)',  // Red
    'rgba(54, 162, 235, 0.6)',  // Blue
    'rgba(173, 216, 230, 0.8)', // DarkLightBlue
    'rgba(128, 0, 128, 0.8)',   // DarkPurple
    'rgba(75, 0, 130, 0.8)'     // DarkIndigo
];

let mockData = []; 
let mappedKeys = []
let filteredData = [...mockData];
let appliedFilters = { regions: [], stores: [], groups: [], subgroups: [], brands: [], sellers: [] };
let currentPage = 1;
const itemsPerPage = 10;

function extractSheetID(url) {
    const regex = /spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const match = url.match(regex);
    log("Match encontrado", match);
    return match ? match[1] : null;
}

async function fetchSheetMetadata(sheetId, apiKey) {
    const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?key=${apiKey}`;
    const response = await fetch(endpoint);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao buscar metadados da planilha: ${errorText}`);
    }

    const metadata = await response.json();
    const sheetNames = metadata.sheets.map(sheet => sheet.properties.title);
    log("Abas disponíveis", sheetNames);
    return sheetNames;
}

async function fetchGoogleSheet(sheetUrl, apiKey, sheetName) {
    const sheetId = extractSheetID(sheetUrl);

    if (!sheetId) {
        throw new Error("URL inválida ou Sheet ID não encontrado.");
    }

    const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}?key=${apiKey}`;
    const response = await fetch(endpoint);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao buscar dados da planilha: ${errorText}`);
    }

    const data = await response.json();
    const rows = data.values;

    if (!rows || rows.length === 0) {
        throw new Error("Nenhum dado encontrado na planilha.");
    }

    const headers = rows[0];
    return rows.slice(1).map(row => {
        return headers.reduce((acc, header, index) => {
            acc[header] = isNaN(row[index]) ? row[index] : Number(row[index]);
            return acc;
        }, {});
    });
}
/*
async function initializeDashboard() {
    const sheetUrl = localStorage.getItem('spreadsheetUrl');
    const apiKey = localStorage.getItem('apiKey');
    const sugestKey = document.getElementById('sugestKey').value;

    if (!sheetUrl || !apiKey) {
        alert("Por favor, insira a URL da planilha e a API Key.");
        return;
    }

    try {
        const sheetId = extractSheetID(sheetUrl);
        const sheetNames = await fetchSheetMetadata(sheetId, apiKey);

        if (sheetNames.length === 0) {
            throw new Error("Nenhuma aba disponível na planilha.");
        }

        const data = await fetchGoogleSheet(sheetUrl, apiKey, sheetNames[0]);
        mockData = data;
        log("Dados recuperados", mockData);
        mapKeys(mockData)
        updateDashboard();
    } catch (error) {
        console.error("Erro na inicialização do dashboard:", error.message);
    }
}
*/

function updateDashboard() {
    filteredData = [...mockData]; 
    console.log("Dashboard atualizado com dados:", filteredData);
}



let salesByRegionChart, salesByStoreChart, salesByGroupChart, salesBySubgroupChart, salesByBrandChart, salesBySellerChart;

const filtersContainer = document.getElementById("filtersContainer");
const totalSalesElement = document.getElementById("totalSales");
const averageTicketElement = document.getElementById("averageTicket");
const totalOrdersElement = document.getElementById("totalOrders");
const salesTable = document.getElementById("tableContent");
const paginationContainer = document.getElementById("pagination");
const salesByRegionContainer = document.getElementById("salesByRegionContainer");
const salesByStoreContainer = document.getElementById("salesByStoreContainer");
const salesByGroupContainer = document.getElementById("salesByGroupContainer");
const salesBySubgroupContainer = document.getElementById("salesBySubgroupContainer");
const salesByBrandContainer = document.getElementById("salesByBrandContainer");
const salesBySellerContainer = document.getElementById("salesBySellerContainer");
const loginForm = document.getElementById('loginForm')

//Google console;
//AIzaSyDye_K10qNpqTDTvteQCcXVgddeqTtKHI4 
loginForm.addEventListener('submit', function (e) {
    e.preventDefault();

    // Coletar os dados do formulário
    const spreadsheetUrl = document.getElementById('spreadsheetUrl').value;
    const apiKey = document.getElementById('apiKey').value;
    const sugestKey = document.getElementById('sugestKey').value;
    alert("alo")
    // Salvar os dados no localStorage
    localStorage.setItem('spreadsheetUrl', spreadsheetUrl);
    localStorage.setItem('apiKey', apiKey);
    localStorage.setItem('sugestKey', sugestKey);


    // Inicializar o dashboard
    console.log("estou sendo chamado ?")
    initializeDashboard();
});
const regionColors = {};
const storeColors = {};
const groupColors = {};
const subgroupColors = {};
const brandColors = {};
const sellerColors = {};

function log(message, data) {
    if (iflog) {
        console.log(message, data);
    }
}

function getColor(index) {
    return colorPalette[index % colorPalette.length];
}

function updateFiltersUI() {
    filtersContainer.innerHTML = '';
    Object.keys(appliedFilters).forEach(filterType => {
        appliedFilters[filterType].forEach(filter => {
            const filterLabel = getFilterLabel(filterType, filter);
            const filterItem = document.createElement("div");
            filterItem.className = "filter-item";
            filterItem.textContent = filterLabel;
            const removeIcon = document.createElement("span");
            removeIcon.textContent = "x";
            removeIcon.onclick = () => {
                appliedFilters[filterType] = appliedFilters[filterType].filter(item => item !== filter);
                updateDashboard();
            };
            filterItem.appendChild(removeIcon);
            filtersContainer.appendChild(filterItem);
        });
    });
    log("Filters UI updated", appliedFilters);
}

function getFilterLabel(filterType, filter) {
    if (filterType === 'regions') {
        return filteredData.find(item => item.ID_REGIAO === filter).REGIAO;
    } else if (filterType === 'stores') {
        return filteredData.find(item => item.ID_LOJA === filter).LOJA;
    } else if (filterType === 'groups') {
        return filteredData.find(item => item.ID_GRUPO === filter).GRUPO;
    } else if (filterType === 'subgroups') {
        return filteredData.find(item => item.ID_SUBGRUPO === filter).SUBGRUPO;
    } else if (filterType === 'brands') {
        return filteredData.find(item => item.ID_MARCA === filter).MARCA;
    } else if (filterType === 'sellers') {
        return filteredData.find(item => item.ID_VENDEDOR === filter).VENDEDOR;
    }
    return '';
}

function updateDashboard() {
    disableInteractions();

    filteredData = mockData.filter(item =>
        (appliedFilters.regions.length === 0 || appliedFilters.regions.includes(item.ID_REGIAO)) &&
        (appliedFilters.stores.length === 0 || appliedFilters.stores.includes(item.ID_LOJA)) &&
        (appliedFilters.groups.length === 0 || appliedFilters.groups.includes(item.ID_GRUPO)) &&
        (appliedFilters.subgroups.length === 0 || appliedFilters.subgroups.includes(item.ID_SUBGRUPO)) &&
        (appliedFilters.brands.length === 0 || appliedFilters.brands.includes(item.ID_MARCA)) &&
        (appliedFilters.sellers.length === 0 || appliedFilters.sellers.includes(item.ID_VENDEDOR))
    );

    filteredData.sort((a, b) => b.SUBTOTAL - a.SUBTOTAL);

    updateKPIs();
    updateCharts();
    updateTable();
    updateTableHeaders();
    updateFiltersUI();
    updatePagination();

    enableInteractions();
}

function updateKPIs() {
    const totalSales = filteredData.reduce((sum, item) => sum + item.SUBTOTAL, 0);
    const averageTicket = totalSales / filteredData.length || 0;

    totalSalesElement.textContent = totalSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    averageTicketElement.textContent = averageTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    totalOrdersElement.textContent = filteredData.length;

    log("KPIs updated", { totalSales, averageTicket, totalOrders: filteredData.length });
}

function assignColors(items, colorMap) {
    items.forEach((item, index) => {
        if (!colorMap[item]) {
            colorMap[item] = getColor(Object.keys(colorMap).length);
        }
    });
}

// essa queridinha manda em tudo;
function updateCharts() {
    // Vendas por Região
    const salesByRegion = filteredData.reduce((acc, item) => {
        if (!acc[item.ID_REGIAO]) {
            acc[item.ID_REGIAO] = { label: item.REGIAO, id: item.ID_REGIAO, value: 0 };
        }
        acc[item.ID_REGIAO].value += item.SUBTOTAL;
        return acc;
    }, {});

    const regionEntries = Object.values(salesByRegion).sort((a, b) => b.value - a.value);
    const regionLabels = regionEntries.map(entry => entry.label);
    const regionData = regionEntries.map(entry => entry.value);

    assignColors(regionLabels, regionColors);
    const regionColorsArray = regionLabels.map(label => regionColors[label]);

    if (salesByRegionChart) {
        salesByRegionChart.destroy();
    }

    const ctxRegion = document.getElementById("salesByRegionChart").getContext("2d");

    salesByRegionChart = new Chart(ctxRegion, {
        type: 'bar',
        data: {
            labels: regionLabels,
            datasets: [{
                label: 'Vendas por Região',
                data: regionData,
                backgroundColor: regionColorsArray,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: true
                    }
                },
                y: {
                    beginAtZero: true
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuad'
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.raw);
                            return label;
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Label do data',
                    font: {
                        size: 18
                    }
                },
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        fontSize: 14,
                        boxWidth: 20
                    }
                }
            },
            onClick: (e, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const region = regionEntries[index];
                    toggleFilter('regions', region.id);
                }
            }
        }
    });
}

function toggleFilter(type, id) {
    if (appliedFilters[type].includes(id)) {
        appliedFilters[type] = appliedFilters[type].filter(item => item !== id);
    } else {
        appliedFilters[type].push(id);
    }
    log("Filter toggled", { type, id, appliedFilters });
    updateDashboard();
}
//mapear labels
function mapKeys (data){
    console.log("estou sendo chamado, sou mapKeys?")
    if (data.length > 0) {
        mappedKeys = Object.keys(data[0]); 
    }

    console.log("agora estou mapedo", mappedKeys)
}           

function updateTableHeaders() {
    const tableHead = document.querySelector("thead tr");
    tableHead.innerHTML = ""; 
    mappedKeys.forEach(key => {
        const th = document.createElement("th");
        th.textContent = key; 
        tableHead.appendChild(th);
    });
} 
//Tambem funciona bem;
function updateTable() {
    salesTable.innerHTML = '';

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedData = filteredData.slice(start, end);

    paginatedData.forEach(item => {
        const row = document.createElement("tr");
        mappedKeys.forEach(key => {
            const cell = document.createElement("td");
            cell.textContent = item[key]; 
            row.appendChild(cell);
        });

        salesTable.appendChild(row);
    });

    log("Table updated", paginatedData);
}

//workfine
function updatePagination() {
    paginationContainer.innerHTML = '';

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement("button");
        button.textContent = i;
        if (i === currentPage) {
            button.classList.add('disabled');
        }
        button.addEventListener('click', () => {
            currentPage = i;
            updateTable();
            updatePagination();
        });
        paginationContainer.appendChild(button);
    }

    log("Pagination updated", { currentPage, totalPages });
}

//exporttar via csv.(passar mappedKey parara csvData.push)
document.getElementById("exportButton").addEventListener("click", () => {
    const csvData = [];
    csvData.push(["ID Pedido", "Produto", "Marca", "Quantidade", "Preço de Venda", "Subtotal"]);
    filteredData.forEach(item => {
        csvData.push([
            item.ID_PEDIDO,
            item.PRODUTO,
            item.MARCA,
            item.QUANTIDADE,
            item.PRECO_VENDA,
            item.SUBTOTAL
        ]);
    });
    const csvContent = "data:text/csv;charset=utf-8," 
        + csvData.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "dados_vendas.csv");
    document.body.appendChild(link);
    link.click();

    log("Data exported", csvData);
});



function disableInteractions() {
    document.querySelectorAll('.chart-container').forEach(container => {
        container.style.pointerEvents = 'none';
    });
}

function enableInteractions() {
    document.querySelectorAll('.chart-container').forEach(container => {
        container.style.pointerEvents = 'auto';
    });
}

  
// Carregar gráficos inicialmente vazios
//initializeCharts();

window.addEventListener("resize", () => {
    updateCharts();
    log("Window resized", { width: window.innerWidth, height: window.innerHeight });
});

// Simular delay para exibir dados mock (exemplo)
setTimeout(() => {
    updateDashboard();
}, 1000);