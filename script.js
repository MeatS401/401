// 全局变量
let currentTab = 'reagents';
let recordModal;
let data = {
    reagents: [],
    inventory: [],
    equipment: [],
    accessories: []
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化Bootstrap模态框
    recordModal = new bootstrap.Modal(document.getElementById('recordModal'));
    
    // 从localStorage加载数据
    loadDataFromStorage();
    
    // 自动加载CSV文件
    setTimeout(() => {
        autoLoadCSVFiles();
    }, 1000);
    
    // 为标签页切换添加事件监听
    document.querySelectorAll('.nav-link').forEach(tab => {
        tab.addEventListener('click', function() {
            currentTab = this.id.replace('-tab', '');
            updateModalFields(); // 切换标签页时更新模态框字段
        });
    });
    
    // 初始化图表
    initCharts();

    // 页面加载后默认隐藏出库表单区域
    var outArea = document.getElementById('outFormArea');
    if (outArea) outArea.style.display = 'none';
});

// 从localStorage加载数据
function loadDataFromStorage() {
    const storedData = localStorage.getItem('labManagementData');
    if (storedData) {
        data = JSON.parse(storedData);
        updateTables();
    }
}

// 保存数据到localStorage
function saveDataToStorage() {
    localStorage.setItem('labManagementData', JSON.stringify(data));
}

// 显示添加记录模态框
function showAddModal(type) {
    $('#recordForm')[0].reset();
    updateModalFields(type);
    document.getElementById('editId').value = '';
    document.querySelector('.modal-title').textContent = '添加记录';
    recordModal.show();
}

// 更新模态框字段
function updateModalFields(type) {
    // 如果传入了type参数，则更新currentTab
    if (type) {
        currentTab = type;
    }
    
    const form = document.getElementById('recordForm');
    form.innerHTML = ''; // 清空表单
    
    let fields = [];
    switch(currentTab) {
        case 'reagents':
            fields = [
                { id: 'name', label: '试剂/耗材名称', type: 'text' },
                { id: 'brand', label: '品牌', type: 'text' },
                { id: 'specification', label: '规格', type: 'text' },
                { id: 'purchaseDate', label: '采购时间', type: 'date' },
                { id: 'expiryDate', label: '有效期', type: 'date' },
                { id: 'price', label: '单价', type: 'number' },
                { id: 'location', label: '存放位置', type: 'text' },
                { id: 'quantity', label: '库存总量', type: 'number' }
            ];
            break;
        case 'inventory':
            fields = [
                { id: 'name', label: '名称', type: 'text' },
                { id: 'inDate', label: '入库时间', type: 'date' },
                { id: 'inQuantity', label: '入库数量', type: 'number' },
                { id: 'inPerson', label: '入库人', type: 'text' },
                { id: 'outDate', label: '出库时间', type: 'date' },
                { id: 'outQuantity', label: '出库数量', type: 'number' },
                { id: 'outPerson', label: '使用人', type: 'text' },
                { id: 'totalQuantity', label: '库存总量', type: 'number' },
                { id: 'location', label: '存放位置', type: 'text' }
            ];
            break;
        case 'equipment':
            fields = [
                { id: 'assetId', label: '资产编号', type: 'text' },
                { id: 'name', label: '仪器名称', type: 'text' },
                { id: 'brand', label: '品牌', type: 'text' },
                { id: 'model', label: '仪器型号', type: 'text' },
                { id: 'location', label: '存放地点', type: 'text' }
            ];
            break;
        case 'accessories':
            fields = [
                { id: 'equipment', label: '仪器', type: 'text' },
                { id: 'name', label: '配件名称', type: 'text' },
                { id: 'quantity', label: '库存个数', type: 'number' },
                { id: 'location', label: '存放位置', type: 'text' }
            ];
            break;
    }
    
    // 添加隐藏的ID字段
    const hiddenId = document.createElement('input');
    hiddenId.type = 'hidden';
    hiddenId.id = 'editId';
    form.appendChild(hiddenId);
    
    // 创建表单字段
    fields.forEach(field => {
        const div = document.createElement('div');
        div.className = 'mb-3';
        
        const label = document.createElement('label');
        label.className = 'form-label';
        label.textContent = field.label;
        
        const input = document.createElement('input');
        input.type = field.type;
        input.className = 'form-control';
        input.id = field.id;
        input.required = true;
        if (field.type === 'number') {
            input.min = '0'; // 限制最小值为0
        }
        
        div.appendChild(label);
        div.appendChild(input);
        form.appendChild(div);
    });
}

// 保存记录
function saveRecord() {
    const form = document.getElementById('recordForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const record = {};
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (input.id) {
            record[input.id] = input.value;
        }
    });
    
    const editId = document.getElementById('editId').value;
    if (editId) {
        // 编辑现有记录
        const index = data[currentTab].findIndex(item => item.id === editId);
        if (index !== -1) {
            // 保留原有ID
            record.id = editId;
            data[currentTab][index] = record;
        }
    } else {
        // 添加新记录
        record.id = Date.now().toString();
        data[currentTab].push(record);
    }

    saveDataToStorage();
    updateTables();
    recordModal.hide();
}

// 删除记录
function deleteRecord(id) {
    if (confirm('确定要删除这条记录吗？')) {
        data[currentTab] = data[currentTab].filter(item => item.id !== id);
        saveDataToStorage();
        updateTables();
    }
}

// 编辑记录
function editRecord(id) {
    const record = data[currentTab].find(item => item.id === id);
    if (record) {
        document.getElementById('editId').value = record.id;
        updateModalFields(currentTab); // 先更新字段
        
        // 根据不同的标签页设置值
        switch(currentTab) {
            case 'reagents':
                document.getElementById('name').value = record.name || '';
                document.getElementById('brand').value = record.brand || '';
                document.getElementById('specification').value = record.specification || '';
                document.getElementById('purchaseDate').value = record.purchaseDate || '';
                document.getElementById('expiryDate').value = record.expiryDate || '';
                document.getElementById('price').value = record.price || '';
                document.getElementById('location').value = record.location || '';
                document.getElementById('quantity').value = record.quantity || '';
                break;
            case 'inventory':
                document.getElementById('name').value = record.name || '';
                document.getElementById('inDate').value = record.inDate || '';
                document.getElementById('inQuantity').value = record.inQuantity || '';
                document.getElementById('inPerson').value = record.inPerson || '';
                document.getElementById('outDate').value = record.outDate || '';
                document.getElementById('outQuantity').value = record.outQuantity || '';
                document.getElementById('outPerson').value = record.outPerson || '';
                document.getElementById('totalQuantity').value = record.totalQuantity || '';
                document.getElementById('location').value = record.location || '';
                break;
            case 'equipment':
                document.getElementById('assetId').value = record.assetId || '';
                document.getElementById('name').value = record.name || '';
                document.getElementById('brand').value = record.brand || '';
                document.getElementById('model').value = record.model || '';
                document.getElementById('location').value = record.location || '';
                break;
            case 'accessories':
                document.getElementById('equipment').value = record.equipment || '';
                document.getElementById('name').value = record.name || '';
                document.getElementById('quantity').value = record.quantity || '';
                document.getElementById('location').value = record.location || '';
                break;
        }
        
        document.querySelector('.modal-title').textContent = '编辑记录';
        recordModal.show();
    }
}

// 更新表格显示
function updateTables() {
    // 更新试剂耗材表格
    updateReagentsTable();
    
    // 更新出入库登记表格
    updateInventoryTable();
    
    // 更新仪器设备表格
    updateEquipmentTable();
    
    // 更新仪器配件表格
    updateAccessoriesTable();
    
    // 更新图表
    updateCharts();
}

// 更新试剂耗材表格
function updateReagentsTable() {
    const table = document.getElementById('reagentsTable');
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    
    data.reagents.forEach(record => {
        const tr = document.createElement('tr');
        
        // 添加数据单元格
        const cells = [
            record.name || '',
            record.brand || '',
            record.specification || '',
            record.purchaseDate || '',
            record.expiryDate || '',
            record.price || '',
            record.location || '',
            record.quantity || ''
        ];
        
        cells.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        
        // 添加操作按钮
        const actionTd = document.createElement('td');
        actionTd.className = 'action-buttons';
        actionTd.innerHTML = `
            <button class="btn btn-sm btn-primary" onclick="editRecord('${record.id}')">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteRecord('${record.id}')">
                <i class="fas fa-trash"></i>
            </button>
        `;
        tr.appendChild(actionTd);
        
        tbody.appendChild(tr);
    });
}

// 更新出入库登记表格
function updateInventoryTable() {
    const table = document.getElementById('inventoryTable');
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    
    data.inventory.forEach(record => {
        const tr = document.createElement('tr');
        
        // 添加数据单元格
        const cells = [
            record.name || '',
            record.inDate || '',
            record.inQuantity || '',
            record.inPerson || '',
            record.outDate || '',
            record.outQuantity || '',
            record.outPerson || '',
            record.totalQuantity || '',
            record.location || ''
        ];
        
        cells.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        
        // 添加操作按钮
        const actionTd = document.createElement('td');
        actionTd.className = 'action-buttons';
        actionTd.innerHTML = `
            <button class="btn btn-sm btn-primary" onclick="editRecord('${record.id}')">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteRecord('${record.id}')">
                <i class="fas fa-trash"></i>
            </button>
        `;
        tr.appendChild(actionTd);
        
        tbody.appendChild(tr);
    });
}

// 更新仪器设备表格
function updateEquipmentTable() {
    const table = document.getElementById('equipmentTable');
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    
    data.equipment.forEach(record => {
        const tr = document.createElement('tr');
        
        // 添加数据单元格
        const cells = [
            record.assetId || '',
            record.name || '',
            record.brand || '',
            record.model || '',
            record.location || ''
        ];
        
        cells.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        
        // 添加操作按钮
        const actionTd = document.createElement('td');
        actionTd.className = 'action-buttons';
        actionTd.innerHTML = `
            <button class="btn btn-sm btn-primary" onclick="editRecord('${record.id}')">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteRecord('${record.id}')">
                <i class="fas fa-trash"></i>
            </button>
        `;
        tr.appendChild(actionTd);
        
        tbody.appendChild(tr);
    });
}

// 更新仪器配件表格
function updateAccessoriesTable() {
    const table = document.getElementById('accessoriesTable');
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    
    data.accessories.forEach(record => {
        const tr = document.createElement('tr');
        
        // 添加数据单元格
        const cells = [
            record.equipment || '',
            record.name || '',
            record.quantity || '',
            record.location || ''
        ];
        
        cells.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        
        // 添加操作按钮
        const actionTd = document.createElement('td');
        actionTd.className = 'action-buttons';
        actionTd.innerHTML = `
            <button class="btn btn-sm btn-primary" onclick="editRecord('${record.id}')">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteRecord('${record.id}')">
                <i class="fas fa-trash"></i>
            </button>
        `;
        tr.appendChild(actionTd);
        
        tbody.appendChild(tr);
    });
}

// 搜索表格
function searchTable(type) {
    const input = document.querySelector(`#${type} .search-box input`);
    const filter = input.value.toLowerCase();
    const table = document.getElementById(`${type}Table`);
    const tr = table.getElementsByTagName('tr');

    for (let i = 1; i < tr.length; i++) {
        const td = tr[i].getElementsByTagName('td');
        let txtValue = '';
        for (let j = 0; j < td.length - 1; j++) {
            txtValue += td[j].textContent || td[j].innerText;
        }
        if (txtValue.toLowerCase().indexOf(filter) > -1) {
            tr[i].style.display = '';
        } else {
            tr[i].style.display = 'none';
        }
    }
}

// 导入CSV文件
function importCSV(type) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = function(event) {
            const csvData = event.target.result;
            const records = parseCSV(csvData, type);
            data[type] = records;
            saveDataToStorage();
            updateTables();
        };
        reader.readAsText(file);
    };
    input.click();
}

// 解析CSV数据
function parseCSV(csvText, type) {
    // 移除可能存在的BOM标记
    if (csvText.charCodeAt(0) === 0xFEFF) {
        csvText = csvText.slice(1);
    }
    
    const lines = csvText.split('\n');
    const records = [];
    
    // 跳过标题行，从第二行开始加载
    let startRow = 2;
    
    for (let i = startRow; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const columns = lines[i].split(',').map(col => col.trim());
        let record = { id: Date.now().toString() + i };
        
        switch(type) {
            case 'reagents':
                record = {
                    ...record,
                    name: columns[0] || '',
                    brand: columns[1] || '',
                    specification: columns[2] || '',
                    purchaseDate: columns[3] || '',
                    expiryDate: columns[4] || '',
                    price: columns[5] || '',
                    location: columns[6] || '',
                    quantity: columns[7] || ''
                };
                break;
            case 'inventory':
                record = {
                    ...record,
                    name: columns[0] || '',
                    inDate: columns[1] || '',
                    inQuantity: columns[2] || '',
                    inPerson: columns[3] || '',
                    outDate: columns[4] || '',
                    outQuantity: columns[5] || '',
                    outPerson: columns[6] || '',
                    totalQuantity: columns[7] || '',
                    location: columns[8] || ''
                };
                break;
            case 'equipment':
                record = {
                    ...record,
                    assetId: columns[0] || '',
                    name: columns[1] || '',
                    brand: columns[2] || '',
                    model: columns[3] || '',
                    location: columns[4] || ''
                };
                break;
            case 'accessories':
                record = {
                    ...record,
                    equipment: columns[0] || '',
                    name: columns[1] || '',
                    quantity: columns[2] || '',
                    location: columns[3] || ''
                };
                break;
        }
        
        // 检查记录是否包含有效数据
        const hasValidData = Object.values(record).some((value, index) => {
            // 跳过id字段的检查
            if (index === 0) return false;
            // 检查其他字段是否为空
            return value && value.trim() !== '';
        });
        
        if (hasValidData) {
            records.push(record);
        }
    }
    
    return records;
}

// 初始化图表
function initCharts() {
    // 初始化试剂耗材库存统计图表
    const reagentsChart = echarts.init(document.getElementById('reagentsChart'));
    const equipmentChart = echarts.init(document.getElementById('equipmentChart'));
    
    // 设置图表自适应
    window.addEventListener('resize', function() {
        reagentsChart.resize();
        equipmentChart.resize();
    });
}

// 更新图表数据
function updateCharts() {
    // 更新试剂耗材库存统计
    const reagentsChart = echarts.init(document.getElementById('reagentsChart'));
    const reagentsData = data.reagents.map(item => ({
        name: item.name,
        value: parseInt(item.quantity) || 0
    }));
    
    reagentsChart.setOption({
        title: {
            text: '试剂耗材库存统计',
            left: 'center'
        },
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {c} ({d}%)'
        },
        series: [{
            type: 'pie',
            radius: '60%',
            data: reagentsData,
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            }
        }]
    });

    // 更新设备使用情况统计
    const equipmentChart = echarts.init(document.getElementById('equipmentChart'));
    const locationData = {};
    data.equipment.forEach(item => {
        locationData[item.location] = (locationData[item.location] || 0) + 1;
    });
    
    const equipmentData = Object.entries(locationData).map(([location, count]) => ({
        name: location,
        value: count
    }));
    
    equipmentChart.setOption({
        title: {
            text: '设备存放位置分布',
            left: 'center'
        },
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {c}台设备'
        },
        series: [{
            type: 'pie',
            radius: '60%',
            data: equipmentData,
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            }
        }]
    });
} 

// 自动加载CSV文件
function autoLoadCSVFiles() {
    console.log('开始自动加载CSV文件...');
    
    // 检查是否在GitHub Pages上运行
    const isGitHubPages = window.location.hostname.includes('github.io');
    console.log('运行环境:', isGitHubPages ? 'GitHub Pages' : '本地环境');
    
    // 定义需要自动加载的CSV文件
    let csvFiles = {
        'reagents': './试剂耗材统计.csv',
        'inventory': './出入库登记.csv',
        'equipment': './仪器设备统计.csv',
        'accessories': './仪器配件.csv'
    };
    
    console.log('CSV文件路径配置:', csvFiles);
    
    // 如果在GitHub Pages上，使用完整的URL路径
    if (isGitHubPages) {
        const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '');
        console.log('基础URL:', baseUrl);
        csvFiles = {
            'reagents': baseUrl + '/试剂耗材统计.csv',
            'inventory': baseUrl + '/出入库登记.csv',
            'equipment': baseUrl + '/仪器设备统计.csv',
            'accessories': baseUrl + '/仪器配件.csv'
        };
    }

    // 遍历文件列表并加载每个文件
    Object.keys(csvFiles).forEach(type => {
        console.log(`准备加载文件: ${type} -> ${csvFiles[type]}`);
        loadCSVFile(type, csvFiles[type]);
    });
}

// 加载单个CSV文件
function loadCSVFile(type, fileName) {
    console.log(`开始加载CSV文件: ${fileName}`);
    // 使用fetch API加载CSV文件，指定UTF-8编码
    fetch(fileName, { 
        headers: { 'Content-Type': 'text/csv; charset=utf-8' },
        // 添加模式选项以处理CORS
        mode: 'cors'
    })
        .then(response => {
            console.log(`收到响应: ${fileName}`, response);
            if (!response.ok) {
                throw new Error(`无法加载文件: ${fileName}, 状态码: ${response.status} ${response.statusText}`);
            }
            // 检查内容类型
            const contentType = response.headers.get('content-type');
            console.log(`内容类型: ${contentType}`);
            // 指定UTF-8编码
            return response.text();
        })
        .then(csvData => {
            console.log(`成功获取CSV数据: ${fileName}`, csvData.substring(0, 100));
            // 检查是否获取到了有效的CSV数据
            if (csvData && csvData.length > 0) {
                // 解析CSV数据
                const records = parseCSV(csvData, type);
                console.log(`解析后的记录数量: ${records.length}`, records);
                // 更新数据
                data[type] = records;
                console.log(`更新数据: ${type}`, data[type]);
                // 保存到localStorage
                saveDataToStorage();
                // 更新表格显示
                updateTables();
            } else {
                console.error(`获取到的CSV数据为空: ${fileName}`);
                alert(`获取到的CSV数据为空: ${fileName}`);
            }
        })
        .catch(error => {
            console.error('加载CSV文件时出错:', error);
            // 显示错误信息给用户
            alert(`加载CSV文件 ${fileName} 时出错: ${error.message}`);
            
            // 添加更多错误处理
            if (error instanceof TypeError && error.message.includes('fetch')) {
                console.error('这可能是由于CORS策略阻止了文件访问。请确保通过HTTP服务器而不是直接打开HTML文件来访问页面。');
            }
        });
}

// 出入库登记模态框切换与保存逻辑
function showInventoryModal(type) {
    // 设置操作类型
    document.getElementById('inventoryType').value = type;
    
    if (type === 'in') {
        // 入库模式
        document.getElementById('inventoryModalTitle').textContent = '入库登记';
        document.getElementById('inFormArea').style.display = 'block';
        document.getElementById('outFormArea').style.display = 'none';
        
        // 清空入库表单
        document.getElementById('inName').value = '';
        document.getElementById('inTime').value = '';
        document.getElementById('inQuantity').value = '';
        document.getElementById('inPerson').value = '';
        document.getElementById('inLocation').value = '';
        
        // 设置默认时间为今天
        var today = new Date().toISOString().split('T')[0];
        document.getElementById('inTime').value = today;
        
    } else {
        // 出库模式
        document.getElementById('inventoryModalTitle').textContent = '出库登记';
        document.getElementById('inFormArea').style.display = 'none';
        document.getElementById('outFormArea').style.display = 'block';
        
        // 清空出库表单
        document.getElementById('outName').value = '';
        document.getElementById('outTime').value = '';
        document.getElementById('outQuantity').value = '';
        document.getElementById('outPerson').value = '';
        document.getElementById('outLocation').value = '';
        
        // 设置默认时间为今天
        var today = new Date().toISOString().split('T')[0];
        document.getElementById('outTime').value = today;
    }
    
    // 显示模态框
    var modal = new bootstrap.Modal(document.getElementById('inventoryModal'));
    modal.show();
}

function saveInventoryRecord() {
    // 获取操作类型
    var type = document.getElementById('inventoryType').value;
    
    if (type === 'in') {
        // 入库操作
        var name = document.getElementById('inName').value.trim();
        var time = document.getElementById('inTime').value;
        var quantity = document.getElementById('inQuantity').value;
        var person = document.getElementById('inPerson').value.trim();
        var location = document.getElementById('inLocation').value.trim();
        
        // 验证必填字段
        var missingFields = [];
        if (!name) missingFields.push('入库名称');
        if (!time) missingFields.push('入库时间');
        if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0) missingFields.push('入库数量');
        if (!person) missingFields.push('入库人');
        if (!location) missingFields.push('存放位置');
        
        if (missingFields.length > 0) {
            highlightMissingFields(['inName', 'inTime', 'inQuantity', 'inPerson', 'inLocation'], missingFields);
            alert('请填写以下必填字段：' + missingFields.join('、'));
            return;
        }
        
        // 获取该名称的当前库存总量
        var inventoryRecords = data.inventory.filter(item => item.name === name);
        var currentTotal = inventoryRecords.reduce((sum, item) => sum + parseInt(item.totalQuantity || 0), 0);
        
        // 创建入库记录
        var record = {
            id: Date.now().toString(),
            name: name,
            inDate: time,
            inQuantity: quantity,
            inPerson: person,
            outDate: '',
            outQuantity: '',
            outPerson: '',
            totalQuantity: currentTotal + parseInt(quantity),
            location: location
        };
        
        data.inventory.push(record);
        
    } else {
        // 出库操作
        var name = document.getElementById('outName').value.trim();
        var time = document.getElementById('outTime').value;
        var quantity = document.getElementById('outQuantity').value;
        var person = document.getElementById('outPerson').value.trim();
        var location = document.getElementById('outLocation').value.trim();
        
        // 验证必填字段
        var missingFields = [];
        if (!name) missingFields.push('出库名称');
        if (!time) missingFields.push('出库时间');
        if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0) missingFields.push('出库数量');
        if (!person) missingFields.push('使用人');
        
        if (missingFields.length > 0) {
            highlightMissingFields(['outName', 'outTime', 'outQuantity', 'outPerson'], missingFields);
            alert('请填写以下必填字段：' + missingFields.join('、'));
            return;
        }
        
        // 获取该名称的当前库存总量
        var inventoryRecords = data.inventory.filter(item => item.name === name);
        var currentTotal = inventoryRecords.reduce((sum, item) => sum + parseInt(item.totalQuantity || 0), 0);
        
        // 检查出库数量是否超过库存
        if (parseInt(quantity) > currentTotal) {
            alert('出库数量不能超过当前库存！当前库存：' + currentTotal);
            return;
        }
        
        // 创建出库记录
        var record = {
            id: Date.now().toString(),
            name: name,
            inDate: '',
            inQuantity: '',
            inPerson: '',
            outDate: time,
            outQuantity: quantity,
            outPerson: person,
            totalQuantity: currentTotal - parseInt(quantity),
            location: location || '未指定'
        };
        
        data.inventory.push(record);
    }
    
    // 保存数据并更新表格
    saveDataToStorage();
    updateTables();
    
    // 关闭模态框
    var modal = bootstrap.Modal.getInstance(document.getElementById('inventoryModal'));
    if (modal) modal.hide();
    
    // 显示成功消息
    alert(type === 'in' ? '入库信息保存成功！' : '出库信息保存成功！');
}

// 高亮显示缺失字段
function highlightMissingFields(fieldIds, missingFields) {
    var fieldMap = {
        '入库名称': 'inName',
        '入库时间': 'inTime',
        '入库数量': 'inQuantity',
        '入库人': 'inPerson',
        '存放位置': 'inLocation',
        '出库名称': 'outName',
        '出库时间': 'outTime',
        '出库数量': 'outQuantity',
        '使用人': 'outPerson'
    };
    
    // 清除所有字段的样式
    fieldIds.forEach(function(fieldId) {
        var element = document.getElementById(fieldId);
        if (element) {
            element.style.border = '';
            element.style.boxShadow = '';
        }
    });
    
    // 为缺失字段添加红色边框
    missingFields.forEach(function(fieldName) {
        var fieldId = fieldMap[fieldName];
        if (fieldId) {
            var fieldElement = document.getElementById(fieldId);
            if (fieldElement) {
                fieldElement.style.border = '2px solid #dc3545';
                fieldElement.style.boxShadow = '0 0 5px rgba(220, 53, 69, 0.5)';
                // 自动聚焦到第一个缺失字段
                if (missingFields.indexOf(fieldName) === 0) {
                    fieldElement.focus();
                }
                // 3秒后恢复样式
                setTimeout(function() {
                    fieldElement.style.border = '';
                    fieldElement.style.boxShadow = '';
                }, 3000);
            }
        }
    });
}
