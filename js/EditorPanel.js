/**
 * EditorPanel — cat alignment editor UI (side panel with sliders for offsetX/Y, scaleX/Y, originX/Y).
 */
class EditorPanel {
    constructor(scene) {
        this.scene = scene;
    }

    init() {
        const scene = this.scene;
        const panel = document.getElementById('editor-panel');
        const btnToggle = document.getElementById('btn-editor-toggle');
        const btnClose = document.getElementById('btn-editor-close');
        const catSelect = document.getElementById('edit-cat-select');
        const btnReset = document.getElementById('btn-editor-reset');
        const btnExport = document.getElementById('btn-editor-export');
        const exportBox = document.getElementById('export-box');
        const exportTextarea = document.getElementById('export-textarea');

        // Sliders and labels mapping
        const controls = {
            offsetX: { slider: document.getElementById('slider-offsetX'), val: document.getElementById('val-offsetX') },
            offsetY: { slider: document.getElementById('slider-offsetY'), val: document.getElementById('val-offsetY') },
            scaleX: { slider: document.getElementById('slider-scaleX'), val: document.getElementById('val-scaleX') },
            scaleY: { slider: document.getElementById('slider-scaleY'), val: document.getElementById('val-scaleY') },
            originX: { slider: document.getElementById('slider-originX'), val: document.getElementById('val-originX') },
            originY: { slider: document.getElementById('slider-originY'), val: document.getElementById('val-originY') }
        };

        // Toggle visibility
        btnToggle.onclick = () => {
            panel.classList.toggle('translate-x-full');
        };
        btnClose.onclick = () => {
            panel.classList.add('translate-x-full');
            exportBox.classList.add('hidden');
        };

        // Sync sliders with memory
        function updateSliders(catId) {
            const def = PIECE_DEFS.find(p => p.id === catId);
            if (!def) return;

            for (let key in controls) {
                controls[key].slider.value = def[key];
                controls[key].val.textContent = def[key];
            }
        }

        // Initial sync
        updateSliders(catSelect.value);

        // Change selected cat
        catSelect.onchange = (e) => {
            const catId = e.target.value;
            updateSliders(catId);
            exportBox.classList.add('hidden');

            // Сбрасываем поворот фигуры в 0 при редактировании, чтобы настраивать в базовой ориентации!
            const container = scene.pieces.find(p => p.def.id === catId);
            if (container) {
                // Возвращаем ячейки к базовому дефу
                container.cells = JSON.parse(JSON.stringify(container.def.cells));
                
                // Сбрасываем поворот кошачьей картинки
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
                
                // Сбрасываем поворот блоков
                let blockIndex = 0;
                container.list.forEach(child => {
                    if (!child.isCatImage) {
                        let origCell = container.def.cells[blockIndex++];
                        child.gridX = origCell[0];
                        child.gridY = origCell[1];
                        child.x = origCell[0] * BASE_CS;
                        child.y = origCell[1] * BASE_CS;
                    }
                });

                // Обновляем ghost
                container.ghost.list.forEach((gChild, index) => {
                    let cell = container.cells[index];
                    gChild.x = cell[0] * BASE_CS;
                    gChild.y = cell[1] * BASE_CS;
                });
            }
        };

        // Real-time slider update handler
        function onSliderChange(key, value) {
            const catId = catSelect.value;
            const def = PIECE_DEFS.find(p => p.id === catId);
            if (!def) return;

            def[key] = parseFloat(value);
            controls[key].val.textContent = value;

            // Update corresponding sprite on active scene
            const container = scene.pieces.find(p => p.def.id === catId);
            if (container) {
                const catImg = container.list.find(child => child.isCatImage);
                if (catImg) {
                    if (key === 'offsetX') {
                        catImg.x = def.offsetX;
                        catImg.targetX = def.offsetX;
                    }
                    else if (key === 'offsetY') {
                        catImg.y = def.offsetY;
                        catImg.targetY = def.offsetY;
                    }
                    else if (key === 'scaleX') catImg.scaleX = def.scaleX;
                    else if (key === 'scaleY') catImg.scaleY = def.scaleY;
                    else if (key === 'originX') catImg.originX = def.originX;
                    else if (key === 'originY') catImg.originY = def.originY;
                }
            }

            saveToLocalStorage();
            scene.autosaveActiveProfile();
        }

        // Attach slider listeners
        for (let key in controls) {
            controls[key].slider.oninput = (e) => onSliderChange(key, e.target.value);
        }

        function saveToLocalStorage() {
            const settingsToSave = {};
            PIECE_DEFS.forEach(p => {
                settingsToSave[p.id] = {
                    originX: p.originX,
                    originY: p.originY,
                    offsetX: p.offsetX,
                    offsetY: p.offsetY,
                    scaleX: p.scaleX,
                    scaleY: p.scaleY
                };
            });
            localStorage.setItem('jellycats_editor_settings', JSON.stringify(settingsToSave));
        }

        // Reset cat to defaults
        btnReset.onclick = () => {
            const catId = catSelect.value;
            const def = PIECE_DEFS.find(p => p.id === catId);
            const defaultDef = DEFAULT_SETTINGS[catId];
            if (!def || !defaultDef) return;

            for (let key in defaultDef) {
                onSliderChange(key, defaultDef[key]);
            }
            updateSliders(catId);
        };

        // Generate and display JSON piece definitions for direct copy-pasting
        btnExport.onclick = () => {
            exportBox.classList.remove('hidden');
            
            let code = '        const PIECE_DEFS = [\n';
            PIECE_DEFS.forEach((p, index) => {
                code += '            {\n';
                code += `                id: '${p.id}',\n`;
                code += `                color: 0x${p.color.toString(16).toLowerCase()},\n`;
                code += `                cells: ${JSON.stringify(p.cells)},\n`;
                code += `                originX: ${p.originX},\n`;
                code += `                originY: ${p.originY},\n`;
                code += `                offsetX: ${p.offsetX},\n`;
                code += `                offsetY: ${p.offsetY},\n`;
                code += `                scaleX: ${p.scaleX},\n`;
                code += `                scaleY: ${p.scaleY}\n`;
                code += index === PIECE_DEFS.length - 1 ? '            }\n' : '            },\n';
            });
            code += '        ];';

            exportTextarea.value = code;
            exportTextarea.select();
        };
    }
}
