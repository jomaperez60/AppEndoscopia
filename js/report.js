function formatClinicalNarrative(organ, findings) {
    if (findings.length === 0) {
        switch (organ) {
            case 'Esófago':
                return "Esófago de morfología, calibre y distensibilidad normales. Mucosa de aspecto sonrosado, lisa y brillante, con trama vascular conservada. La unión esofagogástrica coincide con la pinza diafragmática, sin evidencia de lesiones ni estigmas de sangrado.";
            case 'Estómago':
                return "Estómago con lago gástrico de contenido claro y cantidad habitual. Morfología y distensibilidad conservadas a la insuflación. Pliegues gástricos de trayecto y grosor normal. La mucosa del fondo, cuerpo y antro es de características endoscópicas normales. El píloro se observa céntrico, circular y franqueable.";
            case 'Duodeno':
                return "El bulbo duodenal y la segunda porción duodenal presentan morfología normal. La mucosa está íntegra, con el habitual aspecto aterciopelado, sin evidencia de soluciones de continuidad ni lesiones protruyentes.";
            case 'Yeyuno':
                return "Segmentos de yeyuno explorados sin evidencia de alteraciones anatómicas. Morfología, distensibilidad y mucosa de características endoscópicas normales.";
            case 'Exploración':
                return "El procedimiento se realizó sin demoras ni complicaciones técnicas. La extensión del examen fue satisfactoria en relación al objetivo clínico. Además, la preparación de la mucosa fue óptima, permitiendo una valoración diagnóstica nítida y completa.";
            default:
                return "De características endoscópicas normales.";
        }
    }

    // Dynamic phrasing for pathology
    let intro = "";
    switch (organ) {
        case 'Esófago': intro = "El esófago conserva su distensibilidad habitual; sin embargo, "; break;
        case 'Estómago': intro = "En el estómago se observa un lago mucoso normal, destacando que durante la intubación "; break;
        case 'Duodeno': intro = "En la exploración del duodeno bajo visión directa, "; break;
        case 'Yeyuno': intro = "A nivel del yeyuno, evaluado mediante visión luminal, "; break;
        case 'Exploración': intro = "En cuanto a los límites y hallazgos técnicos del estudio endoscópico, "; break;
    }

    const verbs = [
        "se evidencia",
        "se identifica claramente",
        "se observa",
        "se aprecia",
        "llama la atención la presencia de"
    ];

    const connectors = [
        "; adicionalmente, ",
        ". Asimismo, ",
        "; por otra parte, ",
        ". También "
    ];

    const sentences = findings.map((f, idx) => {
        const loc = f.location;
        const desc = cleanMstString(f.description);

        if (!desc) return null;

        const verb = verbs[idx % verbs.length];

        if (loc === 'General' || loc === 'Totalidad del órgano' || loc === 'Totalidad del esófago' || loc === 'Totalidad del estómago') {
            return `${verb} ${desc}`;
        }

        if (idx % 2 === 0) {
            return `a nivel de ${loc.toLowerCase()} ${verb} ${desc}`;
        } else {
            return `${verb} ${desc} localizándose específicamente en ${loc.toLowerCase()}`;
        }
    }).filter(s => s !== null);

    if (sentences.length === 0) return formatClinicalNarrative(organ, []);

    let combined = intro;
    for (let i = 0; i < sentences.length; i++) {
        combined += sentences[i];
        if (i < sentences.length - 1) {
            combined += connectors[i % connectors.length];
        } else {
            combined += ".";
        }
    }

    // Smooth out any syntax glitches
    combined = combined.replace(/\s+/g, ' ').replace(/\. \./g, '.').replace(/, ,/g, ',');
    return combined.charAt(0).toUpperCase() + combined.slice(1);
}

function formatProceduresNarrative(procedimientos) {
    if (!procedimientos || procedimientos.length === 0) return "";

    const sentences = procedimientos.map(p => {
        let fullDesc = p.description;
        let organLoc = "";

        if (fullDesc.includes(': ')) {
            const parts = fullDesc.split(': ');
            organLoc = parts[0].trim();
            fullDesc = parts.slice(1).join(': ').trim();
        }

        let items = fullDesc.split(' - ').map(s => s.trim()).filter(s => {
            const sl = s.toLowerCase();
            return sl !== 'diagnósticos' && sl !== 'terapéuticos';
        });

        if (items.length === 0) return null;

        let procName = items[0];
        let attributes = items.slice(1);

        let subLoc = "la lesión";
        let method = "";
        let purpose = "";
        let result = "";

        attributes.forEach(attr => {
            if (attr.includes(':')) {
                let [label, value] = attr.split(':').map(s => s.trim());
                let l = label.toLowerCase();
                let v = value.toLowerCase();
                if (v === '' || v === '(especificar)') return;

                if (l === 'lugar(es)' && v) subLoc = value.toLowerCase();
                else if (l === 'resultado') result = value.toLowerCase();
                else if (l === 'espécimen' || l === 'objetivo') purpose = `obteniendo muestras para enviar a ${v}`;
                else if (l === 'método' || l === 'instrumento' || l === 'tipo') method = `mediante el uso de ${v}`;
                else if (l === 'colorante') method = `utilizando técnica de cromoendoscopia con ${v}`;
            } else {
                let v = attr.trim().toLowerCase();
                if (v && v !== '(especificar)' && v !== 'sí' && v !== 'no') {
                    if (!method) method = `utilizando técnica ${v}`;
                }
            }
        });

        let sentence = "";
        const nameL = procName.toLowerCase();

        // Fluid Medical Phrasing
        if (nameL.includes('biopsia')) {
            sentence = `se efectuó la toma de biopsias dirigidas a nivel de ${subLoc}`;
            if (method) sentence += ` ${method}`;
            if (purpose) sentence += `, ${purpose}`;
        } else if (nameL.includes('polipectomía') || nameL.includes('polipectomia')) {
            sentence = `se procedió a realizar una polipectomía de ${subLoc}`;
            if (method) sentence += ` ${method}`;
            if (purpose) sentence += `, ${purpose}`;
            else sentence += `, enviando la pieza a anatomía patológica`;
        } else if (nameL.includes('gastrostomía')) {
            sentence = `se instaló exitosamente una sonda de gastrostomía endoscópica percutánea`;
            if (method) sentence += ` ${method}`;
        } else {
            sentence = `se ejecutó el procedimiento de ${nameL} en ${subLoc}`;
            if (method) sentence += ` ${method}`;
            if (purpose) sentence += ` con el fin de obtener muestras para ${purpose}`;
        }

        if (result && result !== '(especificar)') {
            if (result.includes('satisfactori')) {
                sentence += `, culminando el procedimiento de forma satisfactoria y sin sangrado activo residual`;
            } else {
                sentence += `, logrando un resultado ${result}`;
            }
        } else {
            // Default positive outcome for therapeutic procedures
            if (!nameL.includes('biopsia') && !nameL.includes('gastrostomía')) {
                sentence += `, sin evidencia de complicaciones inmediatas`;
            }
        }

        if (organLoc && organLoc !== 'General') {
            return `A nivel de ${organLoc.toLowerCase()}, ${sentence}`;
        }
        return sentence;
    }).filter(s => s !== null);

    if (sentences.length === 0) return "";

    let narrative = "";
    if (sentences.length === 1) {
        narrative = sentences[0];
    } else if (sentences.length === 2) {
        narrative = sentences.join("; posterior a ello, ");
    } else {
        const last = sentences.pop();
        narrative = sentences.join("; ") + "; y en una última instancia, " + last;
    }

    let combined = narrative + ".";
    // Polish
    combined = combined.replace(/\s+/g, ' ').replace(/\. \./g, '.').replace(/ ,/g, ',');
    return combined.charAt(0).toUpperCase() + combined.slice(1);
}

function runLinterChecks() {
    let errores = [];

    // Validar Barrett (Praga)
    const barrett = state.findings.find(f => f.organ === 'Esófago' && f.description.toLowerCase().includes('barrett'));
    if (barrett) {
        const desc = barrett.description.toLowerCase();
        if (!desc.includes('c, cm') || !desc.includes('m, cm')) {
            errores.push("Esófago de Barrett detectado sin la métrica completa de Clasificación Praga (C y M).");
        }
    }

    // Validar Úlcera (Forrest)
    const ulcera = state.findings.find(f => (f.organ === 'Estómago' || f.organ === 'Duodeno') && f.description.toLowerCase().includes('úlcera'));
    if (ulcera) {
        if (!ulcera.description.toLowerCase().includes('forrest')) {
            errores.push("Se reportó una Úlcera en tracto superior pero no se ha estadiado según la Escala de Forrest.");
        }
    }

    // Validar Biopsias (Lugar/Frascos)
    const biopsia = state.procedimientos.find(p => p.description.toLowerCase().includes('biopsia'));
    if (biopsia) {
        if (!biopsia.description.toLowerCase().includes('lugar(es)')) {
            errores.push("Se tomó una Biopsia pero no se ha especificado explícitamente el 'Lugar(es)' o frasco del espécimen.");
        }
    }

    // Validar Tumores / Masas (Tamaño y Evidencia)
    const tumor = state.findings.find(f => f.description.toLowerCase().includes('tumor') || f.description.toLowerCase().includes('masa'));
    if (tumor) {
        const desc = tumor.description.toLowerCase();
        if (!desc.includes('tamaño') && !desc.includes('diámetro')) {
            errores.push(`Se documentó un Tumor/Masa en ${tumor.organ} pero carece de un Tamaño / Diámetro estimado.`);
        }
        if (state.images.length === 0) {
            errores.push(`Se describió un Tumor/Masa sospechoso en ${tumor.organ} pero no hay documentación fotográfica adjunta.`);
        }
    }

    // Validar Várices (Grado y Signos Rojos)
    const varices = state.findings.find(f => f.organ === 'Esófago' && (f.description.toLowerCase().includes('varices') || f.description.toLowerCase().includes('várices')));
    if (varices) {
        const desc = varices.description.toLowerCase();
        if (!desc.includes('grado')) {
            errores.push("Se identificaron Várices Esofágicas sin consignar su Grado (I, II, III).");
        }
        if (!desc.includes('signos rojos')) {
            errores.push("Las Várices Esofágicas deben describir obligatoriamente la presencia/ausencia de 'Signos Rojos'.");
        }
    }

    // Validar Pólipos (Acción Terapéutica)
    const polipo = state.findings.find(f => f.description.toLowerCase().includes('pólipo'));
    if (polipo) {
        const tieneProcedimiento = state.procedimientos.some(p => p.description.toLowerCase().includes('polipectomía') || p.description.toLowerCase().includes('biopsia'));
        if (!tieneProcedimiento) {
            errores.push(`Se halló un Pólipo en ${polipo.organ}, pero no se documentó ninguna Biopsia ni Polipectomía en la bitácora de procedimientos.`);
        }
    }

    // Validar Plan de Acción Inexistente ante patologías delicadas
    if (!state.plan || state.plan.trim() === '') {
        const patologiaGrave = state.findings.find(f => {
            const d = f.description.toLowerCase();
            return d.includes('tumor') || d.includes('masa') || d.includes('varices') || d.includes('várices') || d.includes('úlcera');
        });
        if (patologiaGrave) {
            errores.push(`Se registró anatomía patológica importante (${patologiaGrave.organ}), pero el campo de 'Plan y Recomendaciones' se dejó vacío.`);
        }
    }

    // INDICADORES DE CALIDAD GLOBALES (ASGE / ESGE)

    // Fotodocumentación Mínima
    if (state.images.length < 4) {
        // No duplicar la alerta si el tumor ya la lanzó
        const tumorPrevio = state.findings.find(f => f.description.toLowerCase().includes('tumor') || f.description.toLowerCase().includes('masa'));
        if (!tumorPrevio) {
            errores.push("Calidad Fotográfica: Las guías de la ESGE recomiendan adjuntar un mínimo de 4 a 8 imágenes para mapear adecuadamente un examen de rutina.");
        }
    }

    // Protocolo de Sídney (Gastritis Atrófica / Metaplasia Intestinal)
    const atrofiaMetaplasia = state.findings.find(f => f.organ === 'Estómago' && (f.description.toLowerCase().includes('atrofia') || f.description.toLowerCase().includes('metaplasia')));
    if (atrofiaMetaplasia) {
        const tieneBiopsiaSydney = state.procedimientos.some(p => p.description.toLowerCase().includes('biopsia'));
        if (!tieneBiopsiaSydney) {
            errores.push("Hallazgo Premaligno: Se detalló Atrofia o Metaplasia Gástrica, sin embargo, el Protocolo de Sídney obliga a la toma escalonada de Biopsias, las cuales no están documentadas.");
        }
    }

    // Tiempos de Exploración / Quality ASGE
    if (state.quality && state.quality.tiempo && state.quality.tiempo.includes('< 7')) {
        errores.push("Tiempo de Inspección Cuestionable: Un tiempo total < 7 minutos en EGD correlaciona globalmente con menor detección de cáncer temprano (Indicador de Calidad ASGE).");
    }

    return errores;
}

function generateReport(skipSave = false, force = false) {
    if (!force) {
        const errors = runLinterChecks();
        if (errors.length > 0) {
            let msg = "LINTER (Sugerencias Clínicas):\n\n";
            errors.forEach(e => msg += "• " + e + "\n");
            msg += "\n¿Desea omitir estas advertencias y generar el reporte de todos modos?";
            if (!confirm(msg)) {
                return; // User canceled
            }
        }
    }
    // Only auto-suggest if the field is empty
    const diagArea = document.getElementById('diag-final');
    if (!diagArea.value || diagArea.value.trim() === "" || diagArea.value.includes('normal')) {
        updateAutoDiagnoses();
    }
    const modal = document.getElementById('report-modal');
    const body = document.getElementById('report-preview-body');

    let findingsHtml = '';
    if (state.findings.length === 0 && !state.metadata.diagFinal) {
        findingsHtml = '<p>Examen endoscópico dentro de los límites de la normalidad.</p>';
    } else {
        const byOrgan = { 'Exploración': [], 'Esófago': [], 'Estómago': [], 'Duodeno': [], 'Yeyuno': [] };
        state.findings.forEach(f => { if (byOrgan[f.organ]) byOrgan[f.organ].push(f); });

        ['Exploración', 'Esófago', 'Estómago', 'Duodeno', 'Yeyuno'].forEach(org => {
            const organFindings = byOrgan[org];
            if (organFindings && (organFindings.length > 0 || org !== 'Yeyuno')) {
                const narrative = formatClinicalNarrative(org, organFindings);
                findingsHtml += `<div style="margin-bottom: 15px;">
                    <strong style="color: #000; text-transform: uppercase; font-size: 0.85rem; display: block; margin-bottom: 4px; border-left: 3px solid #333; padding-left: 8px;">${org}:</strong> 
                    <div style="color: #333; text-align: justify; padding-left: 11px;">${narrative}</div>
                </div>`;
            }
        });
    }

    const html = `
        <div class="report-document" style="color: #1a1a1a; font-family: 'Inter', sans-serif; line-height: 1.5;">
            <!-- Header Structure -->
            <div style="display: flex; align-items: center; border-bottom: 3px solid #333; padding-bottom: 15px; margin-bottom: 30px;">
                ${state.settings.logo ? `<div style="width: 100px; padding-right: 20px;"><img src="${state.settings.logo}" style="width: 100%; max-height: 100px; object-fit: contain;"></div>` : ''}
                <div style="flex: 1; text-align: ${state.settings.logo ? 'left' : 'center'};">
                    <h1 style="margin: 0; font-size: 1.8rem; letter-spacing: -0.5px; color: #000;">${state.settings.hospital || "HOSPITAL GENERAL"}</h1>
                    <p style="margin: 4px 0 0 0; color: #555; font-size: 1rem; font-weight: 500;">${state.settings.location || "SERVICIO DE GASTROENTEROLOGÍA Y ENDOSCOPIA"}</p>
                </div>
            </div>

            <div style="text-align: center; margin-bottom: 35px;">
                <h2 style="margin: 0; font-size: 1.4rem; text-transform: uppercase; border-bottom: 1px solid #eee; display: inline-block; padding: 0 40px 5px 40px;">Informe Médico de Endoscopia</h2>
                <div style="font-size: 0.9rem; color: #666; margin-top: 8px;">Fecha de emisión: ${formatDate()}</div>
            </div>

            ${state.patient.alergias && state.patient.alergias.trim() !== '' && state.patient.alergias.toLowerCase() !== 'ninguna' ? `
            <div style="background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; padding: 10px 15px; border-radius: 4px; margin-bottom: 25px; font-weight: bold; display: flex; align-items: center; gap: 10px;">
                ⚠️ ALERGIAS REGISTRADAS: ${state.patient.alergias}
            </div>` : ''}

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 0.95rem;">
                <tr style="border: 1px solid #eee;">
                    <td style="padding: 10px; font-weight: bold; width: 120px;">PACIENTE:</td>
                    <td style="padding: 10px; border-right: 1px solid #eee;">${state.patient.nombre || 'No registro'}</td>
                    <td style="padding: 10px; font-weight: bold; width: 100px;">DNI:</td>
                    <td style="padding: 10px;">${state.patient.dni || 'No registro'}</td>
                </tr>
                <tr style="border: 1px solid #eee;">
                    <td style="padding: 10px; font-weight: bold;">F. NACIMIENTO:</td>
                    <td style="padding: 10px; border-right: 1px solid #eee;">${state.patient.fnacimiento ? formatDate(state.patient.fnacimiento) : '-'} (${state.patient.edad ? state.patient.edad + ' años' : '-'})</td>
                    <td style="padding: 10px; font-weight: bold;">PROCEDENCIA:</td>
                    <td style="padding: 10px;">${state.patient.pais === 'Honduras' ? 
                        ((state.patient.municipio ? state.patient.municipio + ', ' : '') + (state.patient.departamento || 'Honduras')) : 
                        ((state.patient.localidad ? state.patient.localidad + ', ' : '') + (state.patient.pais || '-'))}</td>
                </tr>
                <tr style="border: 1px solid #eee;">
                    <td style="padding: 10px; font-weight: bold;">SEXO:</td>
                    <td style="padding: 10px; border-right: 1px solid #eee;">${state.patient.sexo || '-'}</td>
                    <td style="padding: 10px; font-weight: bold;">MÉDICO REF:</td>
                    <td style="padding: 10px;">${state.clinical.referente || 'No especificado'}</td>
                </tr>
                <tr style="border: 1px solid #eee;">
                    <td style="padding: 10px; font-weight: bold;">INDICACIÓN:</td>
                    <td style="padding: 10px; border-right: 1px solid #eee;">${state.metadata.indicacion || 'Escrutinio'}</td>
                    <td style="padding: 10px; font-weight: bold;">SEDACIÓN:</td>
                    <td style="padding: 10px;">${state.metadata.sedacion || 'Ninguna'}${state.metadata.sedacionPor && state.metadata.sedacion !== 'Tópica / Ninguna' && state.metadata.sedacion !== '' ? ' (' + state.metadata.sedacionPor + ')' : ''}</td>
                </tr>
                <tr style="border: 1px solid #eee;">
                    <td style="padding: 10px; font-weight: bold;">EXTENSIÓN:</td>
                    <td style="padding: 10px;" colspan="3">${state.metadata.extension || 'Duodeno D2'}</td>
                </tr>
                <tr style="border: 1px solid #eee;">
                    <td style="padding: 10px; font-weight: bold;">ANTECEDENTES:</td>
                    <td style="padding: 10px;" colspan="3">
                        <div style="white-space: pre-wrap; font-size: 0.85rem;">${state.patient.antecedentes || 'Sin antecedentes quirúrgicos o patológicos reportados.'}</div>
                    </td>
                </tr>
                <tr style="border: 1px solid #eee;">
                    <td style="padding: 10px; font-weight: bold;">TERAPIA ANTIAGREG.:</td>
                    <td style="padding: 10px;" colspan="3">
                        ${state.clinical.anticoagulante === 'Sí' ?
            `<span style="color: #b45309; font-weight: 600;">Sí activa</span> (${state.clinical.antiTipo || 'Desc.'} - Suspendida: ${state.clinical.antiDias || 0} días previos)`
            : 'Ninguna reportada'}
                    </td>
                </tr>
            </table>

            ${state.histology && state.histology.trim() ? `
            <div style="margin-bottom: 30px;">
                <div style="background: #333; color: white; padding: 6px 12px; font-weight: bold; margin-bottom: 15px; border-radius: 2px;">RESULTADOS HISTOPATOLÓGICOS</div>
                <div style="padding-left: 5px; white-space: pre-wrap;">${state.histology}</div>
            </div>` : ''}

            <div style="margin-bottom: 30px;">
                <div style="background: #333; color: white; padding: 6px 12px; font-weight: bold; margin-bottom: 15px; border-radius: 2px;">HALLAZGOS MACROSCÓPICOS</div>
                <div style="padding-left: 5px;">${findingsHtml}</div>
            </div>

            ${state.procedimientos.length > 0 ? `
            <div style="margin-bottom: 30px;">
                <div style="background: #333; color: white; padding: 6px 12px; font-weight: bold; margin-bottom: 15px; border-radius: 2px;">PROCEDIMIENTOS REALIZADOS</div>
                <div style="color: #333; text-align: justify; padding-left: 11px;">${formatProceduresNarrative(state.procedimientos)}</div>
            </div>
            ` : ''}

            <div style="margin-bottom: 35px;">
                <div style="background: #333; color: white; padding: 6px 12px; font-weight: bold; margin-bottom: 15px; border-radius: 2px;">CONCLUSIONES Y DIAGNÓSTICO</div>
                <div style="padding: 10px; background: #fefce8; border: 1px solid #fef08a; border-radius: 4px; border-left: 4px solid #eab308; white-space: pre-wrap; font-weight: 500;">${document.getElementById('diag-final').value}</div>
            </div>

            <!-- Photos Section -->
            ${state.images.length > 0 ? `
            <div style="margin-bottom: 40px; page-break-before: auto;">
                <div style="background: #333; color: white; padding: 6px 12px; font-weight: bold; margin-bottom: 15px; border-radius: 2px;">DOCUMENTACIÓN FOTOGRÁFICA Y MAPEEO</div>
                
                <!-- Central Diagram Mapping -->
                <div class="report-mapping-container" style="display: flex; gap: 30px; align-items: flex-start; margin-bottom: 30px; background: #fcfcfc; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <div style="position: relative; width: 300px; background: white; border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
                        <img src="gi_diagram.png" style="width: 100%; display: block;">
                        <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
                            <defs>
                                ${state.tagColors.map((color, i) => `
                                    <marker id="pdf-arrow-${i}" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                        <polygon points="0 0, 10 3.5, 0 7" fill="${color}" />
                                    </marker>
                                `).join('')}
                            </defs>
                            ${state.images.map((img, i) => img.x1 !== null ? `
                                <line x1="${img.x1}%" y1="${img.y1}%" x2="${img.x2}%" y2="${img.y2}%" stroke="${state.tagColors[i % state.tagColors.length]}" stroke-width="1" marker-end="url(#pdf-arrow-${i % state.tagColors.length})" />
                                <circle cx="${img.x1}%" cy="${img.y1}%" r="3%" fill="${state.tagColors[i % state.tagColors.length]}" />
                                <text x="${img.x1}%" y="${img.y1 + 1}%" font-size="8" text-anchor="middle" font-weight="bold" fill="white">${i + 1}</text>
                            ` : '').join('')}
                        </svg>
                        <div style="text-align: center; font-size: 0.7rem; color: #888; margin-top: 5px;">Esquema de Localización de Hallazgos</div>
                    </div>
                    
                    <div style="flex: 1; font-size: 0.85rem;">
                        <p style="margin-top: 0; font-weight: bold; color: #333;">Leyenda de Mapeo:</p>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                            ${state.images.filter(img => img.x1 !== null).map((img, i) => `
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="background: ${state.tagColors[i % state.tagColors.length]}; color: white; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold;">${i + 1}</span>
                                    <span style="color: #555;">${img.label}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="report-photos-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                    ${state.images.map((img, i) => `
                        <div style="text-align: center; position: relative;">
                            <img src="${img.data}" style="width: 100%; height: 130px; object-fit: cover; border: 1px solid #eee; border-radius: 4px;">
                            <div style="font-size: 0.8rem; margin-top: 8px; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                <span style="background: ${state.tagColors[i % state.tagColors.length]}; color: white; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: bold;">${i + 1}</span>
                                <span style="color: #333;"><strong>Fig ${i + 1}:</strong> ${img.label}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <div style="margin-bottom: 40px;">
                <div style="background: #333; color: white; padding: 6px 12px; font-weight: bold; margin-bottom: 15px; border-radius: 2px;">PLAN Y RECOMENDACIONES</div>
                <div style="padding-left: 5px; white-space: pre-wrap;">${state.plan || 'No se registran recomendaciones adicionales en esta fecha.'}</div>
            </div>

            <!-- Trazabilidad / Incidentes -->
            ${(state.metadata.trazProcesador || state.metadata.trazCana || state.quality.aeHipo || state.quality.aeBradi || state.quality.aePerf || state.quality.aeSang) ? `
            <div style="margin-top: 50px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; background: #fdfdfd; font-size: 0.8rem; color: #555;">
                <div style="font-weight: bold; margin-bottom: 8px; color: #111;">REGISTRO DE SEGURIDAD Y TRAZABILIDAD INTRAOPERATORIA</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <strong>Equipo (Procesador):</strong> ${state.metadata.trazProcesador || 'N/A'}<br>
                        <strong>Endoscopio (Caña/Serie):</strong> ${state.metadata.trazCana || 'N/A'}<br>
                        <strong>Ciclo Lavado/Desinfección:</strong> ${state.metadata.trazLavado || 'N/A'}
                    </div>
                    <div>
                        <strong>Complicaciones Adversas Inmediatas:</strong><br>
                        Hipoxemia: <span style="color: ${state.quality.aeHipo ? '#dc2626; font-weight:bold;' : 'inherit'}">${state.quality.aeHipo ? 'Sí' : 'No'}</span> | 
                        Bradicardia: <span style="color: ${state.quality.aeBradi ? '#dc2626; font-weight:bold;' : 'inherit'}">${state.quality.aeBradi ? 'Sí' : 'No'}</span><br>
                        Sosp. Perforación: <span style="color: ${state.quality.aePerf ? '#dc2626; font-weight:bold;' : 'inherit'}">${state.quality.aePerf ? 'Sí' : 'No'}</span> | 
                        Sangrado Mayor: <span style="color: ${state.quality.aeSang ? '#dc2626; font-weight:bold;' : 'inherit'}">${state.quality.aeSang ? 'Sí' : 'No'}</span>
                    </div>
                </div>
            </div>` : ''}

            <div style="margin-top: 80px; display: flex; justify-content: flex-end;">
                <div style="text-align: center; width: 300px; border-top: 1px solid #000; padding-top: 10px;">
                    <div style="font-weight: 800; font-size: 1.1rem; color: #000;">${state.settings.physician || state.currentUser.username}</div>
                    <div style="font-size: 0.9rem; color: #444;">${state.settings.specialty || "Médico Gastroenterólogo"}</div>
                    <div style="font-size: 0.8rem; color: #777; margin-top: 2px;">Sello y Firma Autorizada</div>
                </div>
            </div>
            
            <div style="margin-top: 40px; font-size: 0.75rem; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
                Generado por Sistema de Reportes EndoHn - Documentación Médica Digital &copy; Jorge Suazo
            </div>
        </div>`;

    body.innerHTML = html;
    modal.classList.add('active');

    if (!skipSave) saveToHistory();
}

function closeReport() { document.getElementById('report-modal').classList.remove('active'); }

function printReport() {
    const reportContent = document.getElementById('report-preview-body').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html><head><title>Imprimir Reporte</title>
        <style>
            body { font-family: 'Inter', sans-serif; padding: 20px; }
            h1 { border-bottom: 2px solid #ccc; padding-bottom: 10px; }
            .report-section { margin-bottom: 20px; }
            .report-section h4 { text-decoration: underline; margin-bottom: 10px; background: #f8f9fa; padding: 5px;}
            .report-row { display: flex; margin-bottom: 5px; }
            .report-label { font-weight: bold; min-width: 200px; }
            @media print { body { margin: 0; padding: 0; } }
        </style></head>
        <body>${reportContent}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
}
