/**
 * EditorPanel - cat alignment, image, and shape editor UI.
 */
class EditorPanel {
    constructor(scene) {
        this.scene = scene;
        this.refreshAfterRebuild = null;
    }

    init() {
        const scene = this.scene;
        const panel = document.getElementById('editor-panel');
        const btnToggle = document.getElementById('btn-editor-toggle');
        const btnClose = document.getElementById('btn-editor-close');
        const catSelect = document.getElementById('edit-cat-select');
        const btnAddPiece = document.getElementById('btn-editor-add-piece');
        const btnDeletePiece = document.getElementById('btn-editor-delete-piece');
        const imagePathInput = document.getElementById('edit-image-path');
        const imageFileInput = document.getElementById('edit-image-file');
        const imageStatus = document.getElementById('edit-image-status');
        const shapeGrid = document.getElementById('edit-shape-grid');
        const shapeStatus = document.getElementById('edit-shape-status');
        const btnReset = document.getElementById('btn-editor-reset');
        const btnExport = document.getElementById('btn-editor-export');
        const exportBox = document.getElementById('export-box');
        const exportTextarea = document.getElementById('export-textarea');
        const SHAPE_GRID_SIZE = 4;

        const controls = {
            offsetX: { slider: document.getElementById('slider-offsetX'), val: document.getElementById('val-offsetX') },
            offsetY: { slider: document.getElementById('slider-offsetY'), val: document.getElementById('val-offsetY') },
            scaleX: { slider: document.getElementById('slider-scaleX'), val: document.getElementById('val-scaleX') },
            scaleY: { slider: document.getElementById('slider-scaleY'), val: document.getElementById('val-scaleY') },
            originX: { slider: document.getElementById('slider-originX'), val: document.getElementById('val-originX') },
            originY: { slider: document.getElementById('slider-originY'), val: document.getElementById('val-originY') }
        };

        const getSelectedDef = () => PIECE_DEFS.find(p => p.id === catSelect.value);
        const getContainer = (id) => scene.pieces.find(p => p.def.id === id);
        const cellKey = ([x, y]) => `${x},${y}`;
        const getDeletedPieceIds = () => {
            const saved = JSON.parse(localStorage.getItem('jellycats_editor_settings') || '{}');
            const separate = JSON.parse(localStorage.getItem('jellycats_deleted_piece_ids') || '[]');
            return [...new Set([
                ...(Array.isArray(separate) ? separate : []),
                ...(Array.isArray(saved.__deletedPieceIds) ? saved.__deletedPieceIds : [])
            ])];
        };
        const setDeletedPieceIds = (ids) => {
            const saved = JSON.parse(localStorage.getItem('jellycats_editor_settings') || '{}');
            const normalized = [...new Set(ids)];
            saved.__deletedPieceIds = normalized;
            localStorage.setItem('jellycats_deleted_piece_ids', JSON.stringify(normalized));
            localStorage.setItem('jellycats_editor_settings', JSON.stringify(saved));
        };

        const setImageStatus = (text) => {
            if (imageStatus) imageStatus.textContent = text;
        };

        const setShapeStatus = (text) => {
            if (shapeStatus) shapeStatus.textContent = text;
        };

        const normalizeCells = (cells) => {
            const minX = Math.min(...cells.map(c => c[0]));
            const minY = Math.min(...cells.map(c => c[1]));
            return cells
                .map(([x, y]) => [x - minX, y - minY])
                .sort((a, b) => a[1] - b[1] || a[0] - b[0]);
        };

        const updateContainerTextures = (def, textureKey) => {
            const container = getContainer(def.id);
            if (!container) return;

            const catImg = container.list.find(child => child.isCatImage);
            const catShadow = container.list.find(child => child.isCatShadow);
            if (catImg) catImg.setTexture(textureKey);
            if (catShadow) catShadow.setTexture(textureKey);
        };

        const loadTextureFromImage = (def, image) => {
            const textureKey = `${def.id}_editor_${Date.now()}`;
            scene.textures.addImage(textureKey, image);
            updateContainerTextures(def, textureKey);
            setImageStatus('Preview loaded. Add the file path and export code to make it permanent.');
        };

        const loadTextureFromUrl = (def, url) => {
            const cleanUrl = url.trim();
            if (!cleanUrl) return;

            const textureKey = `${def.id}_path_${Date.now()}`;
            scene.load.image(textureKey, cleanUrl);
            scene.load.once(`filecomplete-image-${textureKey}`, () => {
                updateContainerTextures(def, textureKey);
                setImageStatus('Image path loaded for preview.');
            });
            scene.load.once('loaderror', () => {
                setImageStatus('Could not load that image path.');
            });
            scene.load.start();
        };

        const saveToLocalStorage = () => {
            const settingsToSave = {};
            PIECE_DEFS.forEach(p => {
                settingsToSave[p.id] = {
                    imagePath: p.imagePath,
                    color: p.color,
                    cells: p.cells,
                    originX: p.originX,
                    originY: p.originY,
                    offsetX: p.offsetX,
                    offsetY: p.offsetY,
                    scaleX: p.scaleX,
                    scaleY: p.scaleY
                };
            });
            settingsToSave.__deletedPieceIds = getDeletedPieceIds();
            localStorage.setItem('jellycats_editor_settings', JSON.stringify(settingsToSave));
        };

        const renderPieceSelect = (selectedId = catSelect.value) => {
            catSelect.innerHTML = '';
            PIECE_DEFS.forEach((p, index) => {
                const option = document.createElement('option');
                option.value = p.id;
                option.textContent = `${index + 1}. ${p.id} (${p.cells.length} cells)`;
                catSelect.appendChild(option);
            });
            if (PIECE_DEFS.some(p => p.id === selectedId)) catSelect.value = selectedId;
        };

        const renderShapeGrid = (def) => {
            if (!shapeGrid || !def) return;

            shapeGrid.innerHTML = '';
            const active = new Set(def.cells.map(cellKey));
            for (let y = 0; y < SHAPE_GRID_SIZE; y++) {
                for (let x = 0; x < SHAPE_GRID_SIZE; x++) {
                    const key = `${x},${y}`;
                    const button = document.createElement('button');
                    const isActive = active.has(key);
                    button.type = 'button';
                    button.className = [
                        'aspect-square rounded-md border text-xs font-bold transition-colors',
                        isActive
                            ? 'bg-orange-400 border-orange-500 text-white shadow-inner'
                            : 'bg-white border-orange-100 text-orange-300 hover:bg-orange-50'
                    ].join(' ');
                    button.textContent = isActive ? 'X' : '';
                    button.title = `cell ${x},${y}`;
                    button.onclick = () => {
                        const current = new Set(def.cells.map(cellKey));
                        if (current.has(key)) {
                            if (current.size === 1) {
                                setShapeStatus('A figure needs at least one cell.');
                                return;
                            }
                            current.delete(key);
                        } else {
                            current.add(key);
                        }

                        def.cells = normalizeCells([...current].map(item => item.split(',').map(Number)));
                        saveToLocalStorage();
                        scene.autosaveActiveProfile();
                        renderPieceSelect(def.id);
                        renderShapeGrid(def);
                        scene.rebuildPiecesFromDefs(def.id);
                        setShapeStatus(`${def.cells.length} cells`);
                    };
                    shapeGrid.appendChild(button);
                }
            }
            setShapeStatus(`${def.cells.length} cells`);
        };

        const updateSliders = (catId) => {
            const def = PIECE_DEFS.find(p => p.id === catId);
            if (!def) return;

            for (let key in controls) {
                controls[key].slider.value = def[key];
                controls[key].val.textContent = def[key];
            }
            if (imagePathInput) imagePathInput.value = def.imagePath || `assets/cats/${def.id}.png`;
            renderShapeGrid(def);
            setImageStatus('');
        };

        this.refreshAfterRebuild = (selectedId) => {
            renderPieceSelect(selectedId);
            updateSliders(selectedId);
        };

        const resetSelectedRotation = (catId) => {
            const container = getContainer(catId);
            if (!container) return;

            container.cells = JSON.parse(JSON.stringify(container.def.cells));

            const catImg = container.list.find(child => child.isCatImage);
            if (catImg) {
                catImg.angle = 0;
                catImg.x = container.def.offsetX;
                catImg.y = container.def.offsetY;
                catImg.targetX = container.def.offsetX;
                catImg.targetY = container.def.offsetY;
                catImg.targetAngle = 0;
                catImg.realAngle = 0;
            }
        };

        const onSliderChange = (key, value) => {
            const def = getSelectedDef();
            if (!def) return;

            def[key] = parseFloat(value);
            controls[key].val.textContent = value;

            const container = getContainer(def.id);
            if (container) {
                const catImg = container.list.find(child => child.isCatImage);
                const catShadow = container.list.find(child => child.isCatShadow);
                [catImg, catShadow].forEach(sprite => {
                    if (!sprite) return;
                    if (key === 'offsetX') {
                        const shadowOffset = sprite.isCatShadow ? 4 : 0;
                        sprite.x = def.offsetX + shadowOffset;
                        sprite.targetX = def.offsetX;
                    } else if (key === 'offsetY') {
                        const shadowOffset = sprite.isCatShadow ? 6 : 0;
                        sprite.y = def.offsetY + shadowOffset;
                        sprite.targetY = def.offsetY;
                    } else if (key === 'scaleX') {
                        sprite.scaleX = def.scaleX;
                    } else if (key === 'scaleY') {
                        sprite.scaleY = def.scaleY;
                    } else if (key === 'originX') {
                        sprite.originX = def.originX;
                    } else if (key === 'originY') {
                        sprite.originY = def.originY;
                    }
                });
            }

            saveToLocalStorage();
            scene.autosaveActiveProfile();
        };

        btnToggle.onclick = () => {
            panel.classList.toggle('translate-x-full');
        };
        btnClose.onclick = () => {
            panel.classList.add('translate-x-full');
            exportBox.classList.add('hidden');
        };

        if (btnAddPiece) {
            btnAddPiece.onclick = () => {
                let next = 1;
                while (PIECE_DEFS.some(p => p.id === `cat${next}`)) next++;
                const id = `cat${next}`;
                const def = {
                    id,
                    imagePath: 'assets/cats/orangeSolo.png',
                    color: 0x8ecae6,
                    cells: [[0,0]],
                    originX: 0.5,
                    originY: 0.5,
                    offsetX: 0,
                    offsetY: 0,
                    scaleX: 0.45,
                    scaleY: 0.45
                };
                DEFAULT_SETTINGS[id] = {
                    originX: def.originX,
                    originY: def.originY,
                    offsetX: def.offsetX,
                    offsetY: def.offsetY,
                    scaleX: def.scaleX,
                    scaleY: def.scaleY
                };
                setDeletedPieceIds(getDeletedPieceIds().filter(pieceId => pieceId !== id));
                PIECE_DEFS.push(def);
                saveToLocalStorage();
                renderPieceSelect(id);
                updateSliders(id);
                scene.rebuildPiecesFromDefs(id);
                setShapeStatus('New figure added. Toggle cells to shape it.');
            };
        }

        if (btnDeletePiece) {
            btnDeletePiece.onclick = () => {
                const def = getSelectedDef();
                if (!def) return;
                if (PIECE_DEFS.length <= 1) {
                    setShapeStatus('Keep at least one figure.');
                    return;
                }
                if (!window.confirm(`Вы точно хотите удалить фигуру "${def.id}"?`)) {
                    return;
                }

                const removedIndex = PIECE_DEFS.findIndex(p => p.id === def.id);
                if (removedIndex === -1) return;

                PIECE_DEFS.splice(removedIndex, 1);
                delete DEFAULT_SETTINGS[def.id];
                setDeletedPieceIds([...getDeletedPieceIds(), def.id]);

                const nextIndex = Math.min(removedIndex, PIECE_DEFS.length - 1);
                const nextId = PIECE_DEFS[nextIndex].id;
                saveToLocalStorage();
                renderPieceSelect(nextId);
                updateSliders(nextId);
                scene.rebuildPiecesFromDefs(nextId);
                setShapeStatus(`Deleted ${def.id}.`);
            };
        }

        renderPieceSelect();
        updateSliders(catSelect.value);

        catSelect.onchange = (e) => {
            updateSliders(e.target.value);
            exportBox.classList.add('hidden');
            resetSelectedRotation(e.target.value);
        };

        for (let key in controls) {
            controls[key].slider.oninput = (e) => onSliderChange(key, e.target.value);
        }

        if (imagePathInput) {
            imagePathInput.onchange = () => {
                const def = getSelectedDef();
                if (!def) return;

                def.imagePath = imagePathInput.value.trim() || `assets/cats/${def.id}.png`;
                saveToLocalStorage();
                scene.autosaveActiveProfile();
                loadTextureFromUrl(def, def.imagePath);
            };
        }

        if (imageFileInput) {
            imageFileInput.onchange = () => {
                const def = getSelectedDef();
                const file = imageFileInput.files && imageFileInput.files[0];
                if (!def || !file) return;

                const reader = new FileReader();
                reader.onload = () => {
                    const img = new Image();
                    img.onload = () => loadTextureFromImage(def, img);
                    img.onerror = () => setImageStatus('Could not read that image file.');
                    img.src = reader.result;
                };
                reader.readAsDataURL(file);
            };
        }

        btnReset.onclick = () => {
            const def = getSelectedDef();
            if (!def) return;

            const defaultDef = DEFAULT_SETTINGS[def.id];
            if (defaultDef) {
                for (let key in defaultDef) {
                    onSliderChange(key, defaultDef[key]);
                }
            }
            updateSliders(def.id);
        };

        btnExport.onclick = () => {
            exportBox.classList.remove('hidden');

            let code = 'const PIECE_DEFS = [\n';
            PIECE_DEFS.forEach((p, index) => {
                code += '    {\n';
                code += `        id: '${p.id}',\n`;
                code += `        imagePath: '${p.imagePath || `assets/cats/${p.id}.png`}',\n`;
                code += `        color: 0x${p.color.toString(16).toLowerCase()},\n`;
                code += `        cells: ${JSON.stringify(p.cells)},\n`;
                code += `        originX: ${p.originX},\n`;
                code += `        originY: ${p.originY},\n`;
                code += `        offsetX: ${p.offsetX},\n`;
                code += `        offsetY: ${p.offsetY},\n`;
                code += `        scaleX: ${p.scaleX},\n`;
                code += `        scaleY: ${p.scaleY}\n`;
                code += index === PIECE_DEFS.length - 1 ? '    }\n' : '    },\n';
            });
            code += '];';

            exportTextarea.value = code;
            exportTextarea.select();
        };
    }
}
