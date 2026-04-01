// --- Image Tagging Logic ---

function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 900;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= Math.round(MAX_WIDTH / width);
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= Math.round(MAX_HEIGHT / height);
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Comprimir a JPEG con calidad al 70%
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);

                state.images.push({
                    data: compressedDataUrl,
                    x1: null, y1: null, // Label position
                    x2: null, y2: null, // Target position
                    label: 'Sin etiqueta',
                    id: Date.now() + Math.random()
                });
                renderGallery();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function renderGallery() {
    const list = document.getElementById('gallery-list');
    const countEl = document.getElementById('gallery-count');
    if(!list) return;
    
    if (countEl) countEl.innerText = state.images.length;
    
    if (state.images.length === 0) {
        list.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); margin-top: 50px;">Cargue imágenes para comenzar el mapeo.</p>';
        renderTags();
        return;
    }

    list.innerHTML = '';
    state.images.forEach((img, index) => {
        const div = document.createElement('div');
        div.className = `img-tile ${state.selectedImageIndex === index ? 'selected' : ''}`;
        if (state.selectedImageIndex === index) {
            div.style.boxShadow = `0 0 0 2px ${state.tagColors[index % state.tagColors.length]}`;
        }
        
        div.innerHTML = `
            <div class="tile-number" style="background-color: ${state.tagColors[index % state.tagColors.length]}">${index + 1}</div>
            <img src="${img.data}">
            <div class="tile-label">${img.label}</div>
            <button class="remove-img" onclick="removeImage(event, ${index})">&times;</button>
        `;
        div.onclick = () => {
            state.selectedImageIndex = index;
            renderGallery();
        };
        list.appendChild(div);
    });
    renderTags();
}

function assignLabel(text) {
    if(state.selectedImageIndex !== null) {
        state.images[state.selectedImageIndex].label = text;
        renderGallery();
    } else {
        alert("Seleccione una imagen de la galería para etiquetarla.");
    }
}

function assignCustomLabel() {
    const input = document.getElementById('custom-label-text');
    if(state.selectedImageIndex !== null) {
        if(input.value.trim() !== "") {
            state.images[state.selectedImageIndex].label = input.value;
            input.value = "";
            renderGallery();
        }
    } else {
        alert("Seleccione una imagen de la galería para etiquetarla.");
    }
}

function removeImage(e, index) {
    e.stopPropagation();
    state.images.splice(index, 1);
    if(state.selectedImageIndex === index) state.selectedImageIndex = null;
    renderGallery();
}

function handleTagMouseDown(e) {
    if (state.selectedImageIndex === null) {
        alert("Por favor, seleccione primero una imagen de la galería de la izquierda.");
        return;
    }

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // First click sets the label position
    const img = state.images[state.selectedImageIndex];
    img.x1 = x;
    img.y1 = y;
    img.x2 = x; // Initially same
    img.y2 = y;
    
    isDraggingTag = true;
    renderTags();
}

function handleTagMouseMove(e) {
    if (!isDraggingTag || state.selectedImageIndex === null) return;

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const img = state.images[state.selectedImageIndex];
    img.x2 = x;
    img.y2 = y;
    
    renderTags();
}

function handleTagMouseUp() {
    if (!isDraggingTag) return;
    isDraggingTag = false;

    // Auto select next untagged image
    const nextUntagged = state.images.findIndex((img, idx) => img.x1 === null && idx !== state.selectedImageIndex);
    if(nextUntagged !== -1) {
        state.selectedImageIndex = nextUntagged;
    }

    renderGallery();
}

function renderTags() {
    const svg = document.getElementById('tag-overlay');
    if(!svg) return;
    
    svg.innerHTML = '';
    
    // Define marker for arrowheads
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    state.tagColors.forEach((color, i) => {
        const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
        marker.setAttribute("id", `arrowhead-${i}`);
        marker.setAttribute("markerWidth", "10");
        marker.setAttribute("markerHeight", "7");
        marker.setAttribute("refX", "9");
        marker.setAttribute("refY", "3.5");
        marker.setAttribute("orient", "auto");
        const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        polygon.setAttribute("points", "0 0, 10 3.5, 0 7");
        polygon.setAttribute("fill", color);
        marker.appendChild(polygon);
        defs.appendChild(marker);
    });
    svg.appendChild(defs);

    state.images.forEach((img, index) => {
        if (img.x1 === null) return;

        const color = state.tagColors[index % state.tagColors.length];
        const isSelected = state.selectedImageIndex === index;

        // Draw Line (Leader)
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", `${img.x1}%`);
        line.setAttribute("y1", `${img.y1}%`);
        line.setAttribute("x2", `${img.x2}%`);
        line.setAttribute("y2", `${img.y2}%`);
        line.setAttribute("stroke", color);
        line.setAttribute("stroke-width", isSelected ? "1.5" : "1");
        line.setAttribute("marker-end", `url(#arrowhead-${index % state.tagColors.length})`);
        if (isSelected) line.setAttribute("stroke-dasharray", "2,1");
        svg.appendChild(line);

        // Draw Circle for Label
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", `${img.x1}%`);
        circle.setAttribute("cy", `${img.y1}%`);
        circle.setAttribute("r", "2.5%");
        circle.setAttribute("fill", color);
        circle.setAttribute("stroke", isSelected ? "white" : "none");
        circle.setAttribute("stroke-width", "0.5");
        svg.appendChild(circle);

        // Draw number
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", `${img.x1}%`);
        text.setAttribute("y", `${img.y1 + 0.8}%`);
        text.setAttribute("class", "tag-text");
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("font-size", "10px");
        text.setAttribute("fill", "white");
        text.setAttribute("font-weight", "bold");
        text.textContent = index + 1;
        svg.appendChild(text);
    });
}

function clearAllTags() {
    state.images.forEach(img => {
        img.x1 = null; img.y1 = null;
        img.x2 = null; img.y2 = null;
    });
    renderGallery();
}
