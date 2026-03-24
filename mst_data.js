const mstTree = {
    'Esófago': {
        'Lumen': {
            'Estenosis': {
                'Tipo': ['Benigna (Péptica)', 'Cáustica', 'Post-radioterapia', 'Sospecha de Malignidad'],
                'Pasibilidad': ['Franqueable', 'No franqueable']
            },
            'Divertículo': {
                'Localización': ['Zenker (Cricofaríngeo)', 'Medio-esofágico (Tracción)', 'Epifrénico'],
                'Signos': ['Retención de alimento', 'Normal']
            },
            'Hernia Hiatal': ['Pequeña (< 2cm)', 'Mediana (2-5cm)', 'Grande (> 5cm)', 'Paraesofágica'],
            'Compresión Extrínseca': ['Pulsátil (Vascular)', 'Fija'],
            'Otros': ['Anillo / Membrana (Web)', 'Acalasia (Signo de pico)', 'Normal']
        },
        'Contenidos': ['Alimento / Bezoar', 'Sangre fresca', 'Sangre digerida', 'Cuerpo extraño', 'Normal'],
        'Mucosa': {
            'Esofagitis': {
                'Grado (Los Ángeles)': ['Grado A', 'Grado B', 'Grado C', 'Grado D'],
                'Otros': ['Candida (Placas)', 'Eosinofílica (Traquealizada)', 'Corrosiva']
            },
            'Várices': {
                'Tamaño': ['Grado I (Pequeñas, desaparecen con insuflación)', 'Grado II (Tortuosas < 1/3)', 'Grado III (Grandes, ocupan > 1/3)'],
                'Signos Rojos': ['Ausentes', 'Puntos rojos cereza', 'Nipple sign (Blanco)']
            },
            'Esófago de Barrett': {
                'Praga (C)': ['C0', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6+'],
                'Praga (M)': ['M1', 'M2', 'M3', 'M4', 'M5', 'M6+'],
                'Islotes': ['Presentes', 'Ausentes']
            },
            'Otros': ['Eritema', 'Atrofia', 'Friabilidad', 'Acantosis glucogénica', 'Normal']
        },
        'Lesiones': {
            'Pólipo / Masa': {
                'Morfología (París)': ['0-Is (Sésil)', '0-Ip (Pediculado)', '0-IIa (Elevado)', '0-IIc (Deprimido)', 'Masivo'],
                'Superficie': ['Lisa', 'Granular', 'Vellosa', 'Ulcerada']
            },
            'Úlcera': {
                'Número': ['Única', 'Múltiple'],
                'Fondo': ['Limpio', 'Fibrina', 'Sangrado activo'],
                'Bordes': ['Regulares', 'Irregulares / Elevados']
            },
            'Otros': ['Desgarro de Mallory-Weiss', 'Fístula', 'Hematoma']
        }
    },
    'Estómago': {
        'Lumen': {
            'Forma': ['Remanente quirúrgico (Billroth I/II)', 'Deformidad por compresión', 'Normal'],
            'Paredes': ['Insuflación adecuada', 'Poca distensibilidad', 'Linitis plástica?']
        },
        'Contenidos': {
            'Tipo': ['Alimento (Gastroparesia)', 'Bilis (Reflujo)', 'Sangre (Fresh)', 'Posos de café', 'Normal'],
            'Cuerpo Extraño': ['Bezoar', 'Otros']
        },
        'Mucosa': {
            'Gastritis / Eritema': ['Antral', 'Corporal', 'Pangastritis', 'Gastropatía Erosiva'],
            'Atrofia / Metaplasia': ['Signos de atrofia (Vasos visibles)', 'Metaplasia intestinal (Placas)', 'Normal'],
            'Várices Gástricas': ['GOV1', 'GOV2', 'IGV1', 'IGV2'],
            'Otros': ['Hipertensión Portal', 'GAVE (Sandía)', 'Normal']
        },
        'Lesiones': {
            'Úlcera Gástrica': {
                'Clasificación Forrest': ['Ia (Chorro)', 'Ib (Babeante)', 'IIa (Vaso visible)', 'IIb (Coágulo)', 'IIc (Mancha)', 'III (Base limpia)'],
                'Localización': ['Curvatura Menor', 'Curvatura Mayor', 'Antro', 'Cuerpo', 'Fundus']
            },
            'Pólipo / Masa': {
                'Tipo': ['Glándulas fúndicas', 'Hiperplásico', 'Adenoma', 'Submucoso (GIST?)'],
                'Tamaño': ['< 10mm', '10-20mm', '> 20mm']
            },
            'Otros': ['Erosiones', 'Angiectasia', 'Lesión de Dieulafoy']
        }
    },
    'Duodeno': {
        'Lumen': ['Bulbo deformado (Secuela)', 'Estenosis post-bulbar', 'Divertículo peripapilar', 'Normal'],
        'Mucosa': {
            'Inflamación': ['Bulbitis erosiva', 'Duodenitis inespecífica'],
            'Atrofia': ['Sospecha de Celiaquía (Scalloping)', 'Mosaico / Patrón nodular', 'Vellosidades normales'],
            'Otros': ['Sangrado activo / reciente', 'Normal']
        },
        'Lesiones': {
            'Úlcera Duodenal': ['Frente anterior', 'Frente posterior', 'Apex', 'Beso (Kissing)'],
            'Pólipo / Masa': ['Adenoma periampular', 'Brunneroma', 'Normal'],
            'Papila': ['Normal', 'Prominente', 'Periampular']
        }
    }
};

const indicationsTree = {
    'Síntomas': [
        'Disfagia', 'Hematemesis', 'Melena', 'Pirosis', 'Náusea/Vómito', 
        'Pérdida de peso', 'Anemia', 'Molestias abdominales'
    ],
    'Enfermedades': {
        'Tumor': ['Establecido', 'Exclusión de', 'Sospecha de', 'Seguimiento de', 'Tratamiento de'],
        'Enfermedad por reflujo': ['Establecido', 'Exclusión de', 'Sospecha de', 'Seguimiento de', 'Tratamiento de'],
        'Úlcera': ['Establecido', 'Exclusión de', 'Sospecha de', 'Seguimiento de', 'Tratamiento de'],
        'Gastritis': ['Establecido', 'Exclusión de', 'Sospecha de', 'Seguimiento de', 'Tratamiento de'],
        'Estenosis': ['Establecido', 'Exclusión de', 'Sospecha de', 'Seguimiento de', 'Tratamiento de'],
        'Sangrado gastrointestinal': ['Establecido', 'Exclusión de', 'Sospecha de', 'Seguimiento de', 'Tratamiento de'],
        'Várices': ['Establecido', 'Exclusión de', 'Sospecha de', 'Seguimiento de', 'Tratamiento de'],
        'Lesiones precancerosas': ['Establecido', 'Exclusión de', 'Sospecha de', 'Seguimiento de', 'Tratamiento de'],
        'Cuerpo Extraño': ['Establecido', 'Exclusión de', 'Sospecha de', 'Seguimiento de', 'Tratamiento de'],
        'Metástasis (origen desconocido)': ['Establecido', 'Exclusión de', 'Sospecha de', 'Seguimiento de', 'Tratamiento de']
    },
    'Evaluación': [
        'Preoperatoria', 'Post-quirúrgica', 'Escrutinio (escrutinio)', 
        'Historia familiar de neoplasia', 'Anomalía en imagen (especificar)', 
        'Diagnóstico por muestra (especificar)'
    ]
};

const diagAttrs = ['Sospecha de', 'Establecido', 'Exclusión de', 'Seguimiento de', 'Tratamiento de'];
const forrestAttrs = [
    'Tipo I A: activa pulsátil', 'Tipo I B: activa rezumado', 
    'Tipo II A: Vaso visible', 'Tipo II B: material oscuro/coágulo', 
    'Tipo III: sin estigmas de sangrado'
];

const diagnosesTree = {
    'Esófago': {
        'Diagnóstico principal': {
            'Normal': [],
            'Esofagitis por reflujo': diagAttrs,
            'Varices': diagAttrs,
            'Estenosis benigna': diagAttrs,
            'Tumor maligno': diagAttrs,
            'Esófago de Barrett': diagAttrs,
            'Ulcera': diagAttrs
        },
        'Otros diagnósticos': [
            'Acalasia', 'Tumor benigno', 'Divertículo', 'Fístula', 'Cuerpo Extraño', 
            'Hernia de hiato', 'Síndrome de Mallory-Weiss', 'Esofagitis por cándidas', 
            'Esofagitis sin reflujo', 'Pólipo', 'Aspecto Post-quirúrgico', 
            'Aspecto post-escleroterapia', 'Cicatriz', 'Anillo de Schatzki', 'Tumor submucoso'
        ]
    },
    'Estómago': {
        'Diagnóstico principal': {
            'Normal': [],
            'Gastropatías Erosiva': diagAttrs,
            'Gastropatía Eritematosa (hiperémica)': diagAttrs,
            'Gastropatía Hipertrófica': diagAttrs,
            'Gastropatía Hemorrágica': diagAttrs,
            'Mucosa gástrica atrófica': diagAttrs,
            'Sospecha de gastritis': diagAttrs,
            'Gastropatía de la hipertensión portal': diagAttrs,
            'Ulcera gástrica': diagAttrs,
            'Ulcera gástrica sangrante': {
                'Atributos Generales': diagAttrs,
                'Clasificación de Forrest': forrestAttrs
            },
            'Ulcera anastomótica': diagAttrs,
            'Tumor maligno (especificar)': diagAttrs,
            'Pólipos': diagAttrs
        },
        'Otros diagnósticos': [
            'Angiectasia', 'Tumor benigno', 'Sangrado de origen desconocido', 
            'Anomalía vascular de Dieulafoy', 'Divertículo', 'Cáncer gástrico precoz', 
            'Compresión extrínseca', 'Fístula', 'Cuerpo Extraño', 'Retención gástrica', 
            'Helicobacter pylori', 'Gastropatía papulosa', 'Parásitos', 
            'Cambios Post-quirúrgicos', 'Cicatriz', 'Tumor submucoso', 'Varices'
        ]
    },
    'Duodeno': {
        'Diagnóstico principal': {
            'Normal': [],
            'Duodenopatía Erosiva': diagAttrs,
            'Duodenopatía Eritematosa (Hiperémica)': diagAttrs,
            'Duodenopatía Congestiva': diagAttrs,
            'Duodenopatía Hemorrágica': diagAttrs,
            'Ulcera duodenal': diagAttrs,
            'Ulcera duodenal sangrante': {
                'Atributos Generales': diagAttrs,
                'Clasificación de Forrest': forrestAttrs
            },
            'Deformidad ulcerogénica del duodeno': diagAttrs
        },
        'Otros diagnósticos': [
            'Angiectasia', 'Tumor benigno de origen desconocido', 
            'Hiperplasia de glándulas de Brunner', 'Enfermedad celíaca', 
            'Enfermedad de Crohn', 'Divertículo', 'Fístula', 'Tumor maligno', 
            'Parásitos', 'Pólipo(s)', 'Cambios Post-quirúrgicos', 'Cicatriz', 
            'Tumor submucoso', 'Otro (Especificar)'
        ]
    }
};

