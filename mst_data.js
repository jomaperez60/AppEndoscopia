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

