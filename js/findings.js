function openFindings(organ) {
    currentOrgan = organ;
    currentWgoLocation = [];
    currentMstSelection = [];
    document.getElementById('mst-title').innerText = `Localización: ${organ}`;
    const body = document.getElementById('mst-body');
    body.innerHTML = '';
    renderWgoLocations(wgoLocations[organ], body, 0);
    document.getElementById('mst-modal').classList.add('active');
}

function renderWgoLocations(data, container, level) {
    if (!data) return;

    // Clear subsequent levels
    const existingLevels = Array.from(container.children);
    existingLevels.forEach((el, idx) => { if (idx >= level) el.remove(); });

    const div = document.createElement('div');
    div.className = 'mst-level';
    div.innerHTML = `<h4>${level === 0 ? 'Localización:' : 'Sub-localización:'}</h4><div class="mst-grid"></div>`;
    const grid = div.querySelector('.mst-grid');

    if (Array.isArray(data)) {
        if (data.length === 0) {
            // No sub-locations, move to MST
            proceedToMst(container);
            return;
        }
        data.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'mst-btn';
            btn.innerText = item;
            btn.onclick = () => {
                Array.from(grid.children).forEach(c => c.classList.remove('selected'));
                btn.classList.add('selected');
                currentWgoLocation[level] = item;
                currentWgoLocation.splice(level + 1);
                proceedToMst(container);
            };
            grid.appendChild(btn);
        });
    } else if (typeof data === 'object') {
        Object.keys(data).forEach(key => {
            const btn = document.createElement('button');
            btn.className = 'mst-btn';
            btn.innerText = key;
            btn.onclick = () => {
                Array.from(grid.children).forEach(c => c.classList.remove('selected'));
                btn.classList.add('selected');
                currentWgoLocation[level] = key;
                currentWgoLocation.splice(level + 1);
                if (data[key] && data[key].length > 0) {
                    renderWgoLocations(data[key], container, level + 1);
                } else {
                    proceedToMst(container);
                }
            };
            grid.appendChild(btn);
        });
    }
    container.appendChild(div);
}

function proceedToMst(container) {
    const divider = document.createElement('hr');
    divider.className = 'mst-divider';
    container.appendChild(divider);
    
    document.getElementById('mst-title').innerText = `Hallazgos en ${currentOrgan} (${currentWgoLocation.join(' - ')})`;
    renderMstLevel(mstTree[currentOrgan], container, container.children.length);
}

function renderMstLevel(dataObj, container, level) {
    if (!dataObj) return;

    const existingLevels = Array.from(container.children);
    existingLevels.forEach((el, idx) => { if (idx >= level) el.remove(); });

    // Check if it's a multi-attribute container
    if (typeof dataObj === 'object' && !Array.isArray(dataObj)) {
        const keys = Object.keys(dataObj);
        const isMulti = keys.length > 1 && keys.every(k => Array.isArray(dataObj[k]) || (typeof dataObj[k] === 'object' && Object.keys(dataObj[k]).length === 0));
        
        if (isMulti) {
            renderAttributeGroups(dataObj, container, level);
            return;
        }
    }

    const div = document.createElement('div');
    div.className = 'mst-level';
    div.innerHTML = `<h4>${level === 0 ? 'Categoría:' : 'Especificación:'}</h4><div class="mst-grid"></div>`;
    const grid = div.querySelector('.mst-grid');

    const handleSelection = (item) => {
        const oldSpec = div.querySelector('.spec-container');
        if (oldSpec) oldSpec.remove();

        currentMstSelection[level] = item;
        currentMstSelection.splice(level + 1);
        
        if (item.toLowerCase().includes('(especificar)')) {
            const specDiv = document.createElement('div');
            specDiv.className = 'spec-container';
            specDiv.style.cssText = 'margin-top: 12px; padding: 12px; background: rgba(0,0,0,0.05); border: 1px solid var(--border); border-radius: 6px;';
            specDiv.innerHTML = `
                <label style="display:block; margin-bottom: 6px; font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">DETALLE ADICIONAL:</label>
                <input type="text" placeholder="Escriba el detalle aquí..." 
                       style="width: 100%; padding: 8px 12px; border: 1px solid var(--border); border-radius: 4px; font-family: inherit; background: var(--bg-dark); color: var(--text-main);"
                       oninput="updateMstSpec(${level}, '${item}', this.value)">
            `;
            div.appendChild(specDiv);
        }
    };

    if (Array.isArray(dataObj)) {
        if (dataObj.length === 0) return;
        dataObj.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'mst-btn';
            btn.innerText = item;
            btn.onclick = () => {
                Array.from(grid.children).forEach(c => c.classList.remove('selected'));
                btn.classList.add('selected');
                handleSelection(item);
            };
            grid.appendChild(btn);
        });
    } else if (typeof dataObj === 'object') {
        Object.keys(dataObj).forEach(key => {
            const btn = document.createElement('button');
            btn.className = 'mst-btn';
            btn.innerText = key;
            btn.onclick = () => {
                Array.from(grid.children).forEach(c => c.classList.remove('selected'));
                btn.classList.add('selected');
                handleSelection(key);
                renderMstLevel(dataObj[key], container, level + 1);
            };
            grid.appendChild(btn);
        });
    }
    container.appendChild(div);
}

function renderAttributeGroups(dataObj, container, level) {
    const mainDiv = document.createElement('div');
    mainDiv.className = 'mst-multi-container';
    mainDiv.style.cssText = 'margin-top: 10px; border-top: 1px solid var(--border); padding-top: 15px;';
    
    currentMstSelection[level] = { __multi: true, values: {} };
    currentMstSelection.splice(level + 1);

    Object.keys(dataObj).forEach(groupKey => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'mst-attribute-group';
        groupDiv.style.marginBottom = '20px';
        groupDiv.innerHTML = `<h4 style="color: var(--primary); font-size: 0.85rem; margin-bottom: 8px;">${groupKey.toUpperCase()}:</h4><div class="mst-grid"></div>`;
        const grid = groupDiv.querySelector('.mst-grid');
        
        const options = dataObj[groupKey];
        if (Array.isArray(options)) {
            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'mst-btn';
                btn.innerText = opt;
                btn.onclick = () => {
                    Array.from(grid.children).forEach(c => c.classList.remove('selected'));
                    btn.classList.add('selected');
                    
                    const oldSpec = groupDiv.querySelector('.spec-container');
                    if (oldSpec) oldSpec.remove();

                    currentMstSelection[level].values[groupKey] = opt;

                    if (opt.toLowerCase().includes('(especificar)')) {
                        const specDiv = document.createElement('div');
                        specDiv.className = 'spec-container';
                        specDiv.style.cssText = 'margin-top: 8px; padding: 10px; background: rgba(0,0,0,0.03); border: 1px solid var(--border); border-radius: 4px;';
                        specDiv.innerHTML = `<input type="text" placeholder="Detalle..." style="width: 100%; padding: 6px 10px; background: var(--bg-dark); color: var(--text-main); border: 1px solid var(--border); border-radius: 4px;" oninput="updateMstMultiSpec(${level}, '${groupKey}', '${opt}', this.value)">`;
                        groupDiv.appendChild(specDiv);
                    }
                };
                grid.appendChild(btn);
            });
        }
        mainDiv.appendChild(groupDiv);
    });
    container.appendChild(mainDiv);
}

function updateMstMultiSpec(level, groupKey, baseItem, value) {
    if (baseItem.trim() === '(especificar)') {
        currentMstSelection[level].values[groupKey] = value.trim() || baseItem;
    } else {
        const cleanItem = baseItem.replace('(especificar)', '').trim();
        currentMstSelection[level].values[groupKey] = value.trim() ? `${cleanItem} ${value}` : baseItem;
    }
}

function updateMstSpec(level, baseItem, value) {
    if (baseItem.trim() === '(especificar)') {
        currentMstSelection[level] = value.trim() || baseItem;
    } else {
        const cleanItem = baseItem.replace('(especificar)', '').trim();
        currentMstSelection[level] = value.trim() ? `${cleanItem} ${value}` : baseItem;
    }
}

function saveFinding() {
    const cleanMst = [];
    currentMstSelection.forEach(item => {
        if (item === undefined || item === null) return;
        if (typeof item === 'object' && item.__multi) {
            Object.entries(item.values).forEach(([k, v]) => {
                if (v && v.trim()) cleanMst.push(`${k}: ${v}`);
            });
        } else if (item && item.trim()) {
            cleanMst.push(item);
        }
    });
    
    if (cleanMst.length === 0) { alert("Debe seleccionar al menos un descriptor clínico"); return; }
    
    const locationText = currentWgoLocation.length > 0 ? currentWgoLocation.join(' - ') : 'General';
    const findingText = cleanMst.join(' - ');
    
    if (currentOrgan === 'Procedimientos') {
        state.procedimientos.push({
            description: (locationText !== 'General' ? `${locationText}: ` : '') + findingText
        });
        updateProcedimientosList();
        closeMstModal();
        return;
    }

    state.findings.push({ 
        organ: currentOrgan, 
        location: locationText,
        description: findingText 
    });

    if (currentOrgan === 'Exploración') {
        const input = document.getElementById('extension');
        if (input) {
            input.value = `${locationText}: ${findingText}`;
            input.dispatchEvent(new Event('input'));
        }
        state.metadata.extension = input.value;
    }

    closeMstModal();
    updateFindingsList();
}

function updateProcedimientosList() {
    const container = document.getElementById('procedimientos-container');
    if (!container) return;

    if (state.procedimientos.length === 0) {
        container.innerHTML = '<p class="placeholder-text">No se han registrado procedimientos adicionales en este estudio.</p>';
        return;
    }

    container.innerHTML = '';
    state.procedimientos.forEach((proc, idx) => {
        const div = document.createElement('div');
        div.className = 'finding-item';
        div.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(0,0,0,0.03); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 10px;';
        
        const content = document.createElement('div');
        content.innerHTML = `<span style="color: var(--primary); font-weight: 600; margin-right: 10px;">PRO:</span> <span>${proc.description}</span>`;
        
        const btn = document.createElement('button');
        btn.className = 'btn-icon';
        btn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
        btn.style.color = 'var(--danger)';
        btn.onclick = () => deleteProcedimiento(idx);
        
        div.appendChild(content);
        div.appendChild(btn);
        container.appendChild(div);
    });
}

function deleteProcedimiento(index) {
    state.procedimientos.splice(index, 1);
    updateProcedimientosList();
}

function closeMstModal() { document.getElementById('mst-modal').classList.remove('active'); }
function deleteFinding(index) { state.findings.splice(index, 1); updateFindingsList(); }

// --- Indications Logic ---

function openIndications() {
    currentIndicationsSelection = [];
    document.getElementById('indications-title').innerText = "Seleccionar Indicación";
    document.getElementById('indications-body').innerHTML = '';
    renderIndicationsLevel(indicationsTree, document.getElementById('indications-body'), 0);
    document.getElementById('indications-modal').classList.add('active');
}

function renderIndicationsLevel(dataObj, container, level) {
    if (!dataObj) return;

    const existingLevels = Array.from(container.children);
    existingLevels.forEach((el, idx) => { if (idx >= level) el.remove(); });

    // Check if it's a multi-attribute container
    if (typeof dataObj === 'object' && !Array.isArray(dataObj)) {
        const keys = Object.keys(dataObj);
        const isMulti = keys.length > 1 && keys.every(k => Array.isArray(dataObj[k]) || (typeof dataObj[k] === 'object' && Object.keys(dataObj[k]).length === 0));
        
        if (isMulti) {
            renderIndicationAttributeGroups(dataObj, container, level);
            return;
        }
    }

    const div = document.createElement('div');
    div.className = 'mst-level';
    div.innerHTML = `<h4>${level === 0 ? 'Categoría:' : 'Especificación:'}</h4><div class="mst-grid"></div>`;
    const grid = div.querySelector('.mst-grid');

    const handleSelection = (item) => {
        const oldSpec = div.querySelector('.spec-container');
        if (oldSpec) oldSpec.remove();

        currentIndicationsSelection[level] = item;
        currentIndicationsSelection.splice(level + 1);
        
        if (item.toLowerCase().includes('(especificar)')) {
            const specDiv = document.createElement('div');
            specDiv.className = 'spec-container';
            specDiv.style.cssText = 'margin-top: 12px; padding: 12px; background: rgba(0,0,0,0.05); border: 1px solid var(--border); border-radius: 6px;';
            specDiv.innerHTML = `
                <label style="display:block; margin-bottom: 6px; font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">DETALLE ADICIONAL:</label>
                <input type="text" placeholder="Escriba el detalle aquí..." 
                       style="width: 100%; padding: 8px 12px; border: 1px solid var(--border); border-radius: 4px; font-family: inherit; background: var(--bg-dark); color: var(--text-main);"
                       oninput="updateIndicationSpec(${level}, '${item}', this.value)">
            `;
            div.appendChild(specDiv);
        }
    };

    if (Array.isArray(dataObj)) {
        dataObj.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'mst-btn';
            btn.innerText = item;
            btn.onclick = () => {
                Array.from(grid.children).forEach(c => c.classList.remove('selected'));
                btn.classList.add('selected');
                handleSelection(item);
            };
            grid.appendChild(btn);
        });
    } else {
        Object.keys(dataObj).forEach(key => {
            const btn = document.createElement('button');
            btn.className = 'mst-btn';
            btn.innerText = key;
            btn.onclick = () => {
                Array.from(grid.children).forEach(c => c.classList.remove('selected'));
                btn.classList.add('selected');
                handleSelection(key);
                renderIndicationsLevel(dataObj[key], container, level + 1);
            };
            grid.appendChild(btn);
        });
    }
    container.appendChild(div);
}

function renderIndicationAttributeGroups(dataObj, container, level) {
    const mainDiv = document.createElement('div');
    mainDiv.className = 'mst-multi-container';
    
    currentIndicationsSelection[level] = { __multi: true, values: {} };
    currentIndicationsSelection.splice(level + 1);

    Object.keys(dataObj).forEach(groupKey => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'mst-attribute-group';
        groupDiv.style.marginBottom = '20px';
        groupDiv.innerHTML = `<h4 style="color: var(--primary); font-size: 0.85rem; margin-bottom: 8px;">${groupKey.toUpperCase()}:</h4><div class="mst-grid"></div>`;
        const grid = groupDiv.querySelector('.mst-grid');
        
        const options = dataObj[groupKey];
        if (Array.isArray(options)) {
            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'mst-btn';
                btn.innerText = opt;
                btn.onclick = () => {
                    Array.from(grid.children).forEach(c => c.classList.remove('selected'));
                    btn.classList.add('selected');
                    const oldSpec = groupDiv.querySelector('.spec-container');
                    if (oldSpec) oldSpec.remove();

                    currentIndicationsSelection[level].values[groupKey] = opt;

                    if (opt.toLowerCase().includes('(especificar)')) {
                        const specDiv = document.createElement('div');
                        specDiv.className = 'spec-container';
                        specDiv.style.cssText = 'margin-top: 8px; padding: 10px; background: rgba(0,0,0,0.03); border: 1px solid var(--border); border-radius: 4px;';
                        specDiv.innerHTML = `<input type="text" placeholder="Detalle..." style="width: 100%; padding: 6px 10px; background: var(--bg-dark); color: var(--text-main); border: 1px solid var(--border); border-radius: 4px;" oninput="updateIndicationMultiSpec(${level}, '${groupKey}', '${opt}', this.value)">`;
                        groupDiv.appendChild(specDiv);
                    }
                };
                grid.appendChild(btn);
            });
        }
        mainDiv.appendChild(groupDiv);
    });
    container.appendChild(mainDiv);
}

function updateIndicationMultiSpec(level, groupKey, baseItem, value) {
    const cleanItem = baseItem.replace('(especificar)', '').trim();
    currentIndicationsSelection[level].values[groupKey] = value.trim() ? `${cleanItem}: ${value}` : cleanItem;
}

function saveIndication() {
    if (currentIndicationsSelection.length === 0) {
        console.warn("No selection made in Indications modal.");
        return;
    }
    
    const filtered = currentIndicationsSelection.filter(item => item !== undefined && item !== null).map(item => {
        if (typeof item === 'object' && item.__multi) {
            return Object.entries(item.values).map(([k, v]) => `${k}: ${v}`).join(', ');
        }
        return item;
    });
    const text = filtered.join(' - ');
    
    console.log("Saving indication text:", text);
    
    const input = document.getElementById('indicacion');
    if (input) {
        input.value = text;
        input.dispatchEvent(new Event('input'));
    }
    
    state.metadata.indicacion = text;
    closeIndications();
}

function updateIndicationSpec(level, baseItem, value) {
    if (!currentIndicationsSelection) currentIndicationsSelection = [];
    const cleanItem = baseItem.replace('(especificar)', '').trim();
    currentIndicationsSelection[level] = value.trim() ? `${cleanItem}: ${value}` : cleanItem;
}

function closeIndications() { document.getElementById('indications-modal').classList.remove('active'); }

// --- Standardized Diagnoses Logic ---

function openDiagnosesModal() {
    currentDiagnosesSelection = [];
    document.getElementById('diagnoses-modal').classList.add('active');
    document.getElementById('current-diag-preview').innerText = '';
    const body = document.getElementById('diagnoses-body');
    body.innerHTML = '';
    renderDiagnosesLevel(diagnosesTree, body, 0);
}

function renderDiagnosesLevel(dataObj, container, level) {
    if (!dataObj) return;

    const existingLevels = Array.from(container.children);
    existingLevels.forEach((el, idx) => { if (idx >= level) el.remove(); });

    // Check if it's a multi-attribute container
    if (typeof dataObj === 'object' && !Array.isArray(dataObj)) {
        const keys = Object.keys(dataObj);
        const isMulti = keys.length > 1 && keys.every(k => Array.isArray(dataObj[k]) || (typeof dataObj[k] === 'object' && Object.keys(dataObj[k]).length === 0));
        
        if (isMulti && level >= 3) {
            renderDiagnosesAttributeGroups(dataObj, container, level);
            return;
        }
    }

    const div = document.createElement('div');
    div.className = 'mst-level';
    const titles = ['Órgano:', 'Categoría:', 'Diagnóstico:', 'Atributo:', 'Específico:'];
    div.innerHTML = `<h4>${titles[level] || 'Especificación:'}</h4><div class="mst-grid"></div>`;
    const grid = div.querySelector('.mst-grid');

    const handleSelection = (item) => {
        currentDiagnosesSelection[level] = item;
        currentDiagnosesSelection.splice(level + 1);
        updateDiagnosesPreview();
    };

    if (Array.isArray(dataObj)) {
        dataObj.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'mst-btn';
            btn.innerText = item;
            btn.onclick = () => {
                Array.from(grid.children).forEach(c => c.classList.remove('selected'));
                btn.classList.add('selected');
                handleSelection(item);
            };
            grid.appendChild(btn);
        });
    } else {
        Object.keys(dataObj).forEach(key => {
            const btn = document.createElement('button');
            btn.className = 'mst-btn';
            btn.innerText = key;
            btn.onclick = () => {
                Array.from(grid.children).forEach(c => c.classList.remove('selected'));
                btn.classList.add('selected');
                handleSelection(key);
                renderDiagnosesLevel(dataObj[key], container, level + 1);
            };
            grid.appendChild(btn);
        });
    }
    container.appendChild(div);
}

function renderDiagnosesAttributeGroups(dataObj, container, level) {
    const mainDiv = document.createElement('div');
    mainDiv.className = 'mst-multi-container';
    
    currentDiagnosesSelection[level] = { __multi: true, values: {} };
    currentDiagnosesSelection.splice(level + 1);

    Object.keys(dataObj).forEach(groupKey => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'mst-attribute-group';
        groupDiv.style.marginBottom = '20px';
        groupDiv.innerHTML = `<h4 style="color: var(--primary); font-size: 0.85rem; margin-bottom: 8px;">${groupKey.toUpperCase()}:</h4><div class="mst-grid"></div>`;
        const grid = groupDiv.querySelector('.mst-grid');
        
        const options = dataObj[groupKey];
        if (Array.isArray(options)) {
            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'mst-btn';
                btn.innerText = opt;
                btn.onclick = () => {
                    Array.from(grid.children).forEach(c => c.classList.remove('selected'));
                    btn.classList.add('selected');
                    currentDiagnosesSelection[level].values[groupKey] = opt;
                    updateDiagnosesPreview();
                };
                grid.appendChild(btn);
            });
        }
        mainDiv.appendChild(groupDiv);
    });
    container.appendChild(mainDiv);
}

function updateDiagnosesPreview() {
    const preview = document.getElementById('current-diag-preview');
    const filtered = currentDiagnosesSelection.filter(item => item !== undefined && item !== null).map(item => {
        if (typeof item === 'object' && item.__multi) {
            return Object.entries(item.values).map(([k, v]) => `${k}: ${v}`).join(', ');
        }
        return item;
    });
    preview.innerText = filtered.join(' > ');
}

function saveDiagnoses() {
    if (currentDiagnosesSelection.length === 0) return;
    
    const formatted = currentDiagnosesSelection.filter(item => item !== undefined && item !== null).map(item => {
        if (typeof item === 'object' && item.__multi) {
            return Object.entries(item.values).map(([k, v]) => `${k}: ${v}`).join(', ');
        }
        return item;
    });
    
    // Format the selection (e.g., Stomach: Ulcer - Established)
    const organ = formatted[0];
    const category = formatted[1];
    const diag = formatted[2];
    const details = formatted.slice(3).join(' - ');
    
    let text = `${organ}: ${diag}`;
    if (details) text += ` (${details})`;

    const diagArea = document.getElementById('diag-final');
    if (diagArea.value.includes('normal')) diagArea.value = '';
    
    const lines = diagArea.value ? diagArea.value.split('\n') : [];
    if (!lines.includes(text)) {
        diagArea.value = (diagArea.value ? diagArea.value + '\n' : '') + text;
    }
    
    state.metadata.diagFinal = diagArea.value;
    closeDiagnoses();
}

function closeDiagnoses() { document.getElementById('diagnoses-modal').classList.remove('active'); }

function updateFindingsList() {
    const container = document.getElementById('findings-container');
    if (state.findings.length === 0) {
        container.innerHTML = `<p class="placeholder-text">Seleccione un órgano para registrar hallazgos estructurados</p>`;
        return;
    }
    container.innerHTML = '';
    state.findings.forEach((f, idx) => {
        container.innerHTML += `
            <div class="finding-item">
                <div class="body">
                    <span>${f.organ} - <small>${f.location}</small></span>
                    <p>${f.description}</p>
                </div>
                <div class="actions"><button onclick="deleteFinding(${idx})"><i class="fa-solid fa-trash"></i></button></div>
            </div>`;
    });
}

function updateAutoDiagnoses() {
    const diagArea = document.getElementById('diag-final');
    if (state.findings.length === 0) {
        diagArea.value = "Examen endoscópico normal hasta la porción evaluada.";
    } else {
        const order = { 'Exploración': 0, 'Esófago': 1, 'Estómago': 2, 'Duodeno': 3, 'Yeyuno': 4 };
        const sortedFindings = [...state.findings].sort((a, b) => (order[a.organ] ?? 99) - (order[b.organ] ?? 99));
        
        const uniqueOrgans = [...new Set(sortedFindings.map(f => f.organ))];
        let diagText = `Hallazgos patológicos en: ${uniqueOrgans.join(', ')}.\n`;
        sortedFindings.forEach(f => { diagText += `- ${f.organ}: ${f.description}\n`; });
        diagArea.value = diagText;
    }
}

function cleanMstString(str) {
    if (!str) return "";
    
    // Normalize "Tumor / Masa" immediately
    let input = str.replace(/Tumor \/ Masa/gi, 'tumor');
    
    // Split into individual findings (separated by ' - ' in app state)
    let components = input.split(' - ').map(s => s.trim());
    let results = [];

    const labelsToIgnore = [
        'Número', 'Extensión', 'Situación', 'Aspecto', 'Tipo', 
        'Grado', 'Tamaño', 'Sangrado', 'Estigmas de sangrado', 'Estigmas',
        'Circunferencial', 'Obstructivo', 'Pedículo', 'Fondo',
        'Clasificación', 'Atributos Generales', 'morfología', 'distensibilidad',
        'cm desde incisivos', 'Sobrepasable', 'Material de sutura visible', 
        'Material pigmentado', 'Forma', 'Orificio', 'Instrumento', 'Método', 
        'Espécimen', 'Resultado', 'Recuperación del pólipo', 'Precorte', 
        'Forma extracción', 'Material inyectado', 'Volumen', 'Motivo', 
        'Longitud', 'Diámetro', 'Número', 'Lugar(es)', 'Diagnósticos', 'Terapéuticos'
    ];

    for (let i = 0; i < components.length; i++) {
        let comp = components[i];
        let next = components[i + 1] ? components[i + 1].trim() : null;
        
        // Handle "Label: Value" format
        if (comp.includes(':')) {
            let [label, value] = comp.split(':').map(s => s.trim());
            comp = label;
            next = value; // Treat the value as the next item (and we won't skip i++)
        }

        let l = comp.toLowerCase();
        let n = next ? next.toLowerCase() : null;

        // Smart combinations
        if (l === 'sangrado') {
            if (n === 'no') {
                results.push('sin evidencia de sangrado activo');
                if (!components[i].includes(':')) i++; // Skip "no" if it was a separate item
            } else if (n) {
                results.push('con sangrado ' + n);
                if (!components[i].includes(':')) i++;
            } else {
                results.push('sangrado');
            }
        } else if (l === 'estigmas de sangrado' || l === 'estigmas') {
            if (n === 'no') {
                results.push('sin estigmas de sangrado reciente');
                if (!components[i].includes(':')) i++;
            } else if (n) {
                results.push('con estigmas de sangrado ' + n);
                if (!components[i].includes(':')) i++;
            } else {
                results.push('estigmas de sangrado');
            }
        } else if (l === 'circunferencial') {
            if (n === 'si') {
                results.push('circunferencial');
                if (!components[i].includes(':')) i++;
            }
        } else if (l === 'obstructivo') {
            if (n === 'si') {
                results.push('obstructivo');
                if (!components[i].includes(':')) i++;
            }
        } else if (labelsToIgnore.includes(comp)) {
            // Ignore the label if it's just a structural word
            continue;
        } else if (l === 'no') {
            results.push('ausente');
        } else if (l === 'si') {
            results.push('presente');
        } else {
            results.push(l);
        }
    }

    // Join and final cleanup
    let clean = results.filter(r => r && r !== 'si' && r !== 'no').join(', ');
    
    // Global refinements
    clean = clean.replace(/\(especificar\)/gi, '');
    clean = clean.replace(/\s+/g, ' ').trim();
    
    return clean;
}
