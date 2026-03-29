const mstTree = {
    'Esófago': {
        'Normal': [],
        'Luz': {
            'Normal': [],
            'Dilatada': [],
            'Estenosis': {
                'Aspecto': ['Extrínseca', 'Benigna intrínseca', 'Maligna intrínseca'],
                'Longitud (cm)': ['(especificar)'],
                'Sobrepasable': ['Si', 'Tras dilatación', 'No']
            },
            'Compresión Extrínseca': {
                'Tamaño': ['Pequeña', 'Grande']
            },
            'Membrana': [],
            'Anillo (incluye Schatzki)': [],
            'Hernia de Hiato': {
                'Clasificación (Hill)': ['Grado I', 'Grado II', 'Grado III', 'Grado IV'],
                'Tamaño / Volumen': ['Pequeña', 'Mediana', 'Grande'],
                'Línea Z (cm desde incisivos)': ['(especificar)'],
                'Estrechez hiatal (cm desde incisivos)': ['(especificar)']
            },
            'Esfínter esofágico inferior (Cardias)': {
                'Tono': ['Abierto', 'Hipertónico']
            },
            'Evidencia de cirugía previa': {
                'Anastomosis': {
                    'Tipo': ['Esófagoyeyunal', 'Esófagogástrica', 'Esófagocolónica'],
                    'Cm desde incisivos': ['(especificar)']
                },
                'Material de sutura visible': ['Si', 'No']
            }
        },
        'Contenido': {
            'Cuerpo extraño': {
                'Tipo': ['(especificar)']
            },
            'Sangre': {
                'Aspecto': ['Roja', 'Coágulo', 'Hematina (sangre alterada)']
            },
            'Alimento': [],
            'Bilis': [],
            'Prótesis': {
                'Tipo': ['(especificar)']
            },
            'Banda': {
                'Número': ['(especificar)'],
                'Posición': ['Libre', 'Adherido']
            }
        },
        'Mucosa': {
            'Eritematosa (Hiperémica)': {
                'Extensión': ['Parcheada', 'Difusa']
            },
            'Esofagitis': {
                'Clasificación (Los Ángeles)': ['Grado A', 'Grado B', 'Grado C', 'Grado D'],
                'Sangrado': ['Si', 'No']
            },
            'Esofagitis Eosinofílica (EREFS)': {
                'Edema': ['Ausente (0)', 'Presente (1)'],
                'Anillos': ['Ausentes (0)', 'Leves (1)', 'Moderados (2)', 'Severos (3)'],
                'Exudados': ['Ausentes (0)', 'Leves (1)', 'Severos (2)'],
                'Surcos': ['Ausentes (0)', 'Verticales leves (1)', 'Verticales severos (2)'],
                'Estenosis': ['Ausente (0)', 'Presente (1)']
            },
            'Esófago de Barrett': {
                'Clasificación Praga (Circunferencial C, cm)': ['(especificar)'],
                'Clasificación Praga (Máxima M, cm)': ['(especificar)'],
                'Línea Z (cm desde incisivos)': ['(especificar)'],
                'Extremo sup. pliegues gástricos (cm desde incisivos)': ['(especificar)']
            },
            'Candidiasis': {
                'Extensión': ['Localizada', 'Parcheada', 'Difusa']
            },
            'Mucosa esclerosada (fibrosis)': {
                'Tipo': ['Espontánea', 'Post-tratamiento'],
                'Extensión': ['Localizada', 'Parcheada', 'Difusa']
            },
            'Varices': {
                'Grado': ['Grado I', 'Grado II', 'Grado III'],
                'Anchura estimada (mm)': ['(especificar)'],
                'Límite superior (cm desde incisivos)': ['(especificar)'],
                'Sangrado': ['Si: a chorro', 'Si: rezumado', 'No'],
                'Estigmas de sangrado': ['Si', 'No'],
                'Signos rojos': ['Si', 'No']
            }
        },
        'Lesiones': {
            'Lesiones Planas': {
                'Mucosa gástrica ectópica': {
                    'Número': ['Única', 'Múltiples']
                },
                'Placa': {
                    'Número': ['Única', 'Múltiples']
                }
            },
            'Lesiones Protruyentes': {
                'Nódulo': {
                    'Número': ['Única', 'Pocas', 'Muchas'],
                    'Extensión': ['Localizada', 'Parcheada', 'Difusa']
                },
                'Tumor / Masa': {
                    'Tamaño': ['Pequeña', 'Mediana', 'Grande'],
                    'Clasificación Vienna (Superficial)': ['Normal (1)', 'Indefinido (2)', 'Neoplasia Bajo Grado (3)', 'Neoplasia Alto Grado (4)', 'Carcinoma Invasivo (5)'],
                    'Clasificación NICE (NBI)': ['Tipo 1', 'Tipo 2', 'Tipo 3'],
                    'Tipo': ['Submucoso', 'Vegetante', 'Ulcerado'],
                    'Circunferencial': ['Si', 'No'],
                    'Obstructivo': ['Parcial', 'Completa'],
                    'Sangrante': ['Si', 'No'],
                    'Estigmas de sangrado': ['Si', 'No']
                }
            },
            'Lesiones Excavadas': {
                'Síndrome Mallory-Weiss': {
                    'Sangrado': ['Si: a chorro', 'Si: rezumado', 'No'],
                    'Estigmas de sangrado': ['Si', 'No']
                },
                'Erosión': {
                    'Número': ['Única', 'Pocas', 'Muchos']
                },
                'Úlcera': {
                    'Tamaño (mm)': ['(especificar)'],
                    'Sangrado': ['Si: a chorro', 'Si: rezumado', 'No'],
                    'Estigmas de sangrado': ['Si', 'No']
                }
            }
        },
        'Otros': ['Cicatriz', 'Divertículo', 'Fístula']
    },
    'Estómago': {
        'Normal': [],
        'Luz': {
            'Normal': [],
            'Estenosis': {
                'Aspecto': ['Extrínseca', 'Benigna intrínseca', 'Maligna intrínseca'],
                'Estenosis': ['Si', 'No']
            },
            'Deformación': [],
            'Compresión Extrínseca': [],
            'Evidencia de cirugía previa': {
                'Anastomosis': ['Billroth I', 'Billroth II', 'Gastroenteroanastomosis', 'Piloroplastia', 'Cirugía antirreflujo', 'Gastroplastia anillada'],
                'Material de sutura visible': ['Si', 'No']
            },
            'Gastrostomía': {
                'Tipo': ['Quirúrgica', 'Endoscópica (GEP)']
            }
        },
        'Contenido': {
            'Sangre': {
                'Aspecto de sangre': ['Roja', 'Coágulo', 'Hematina (sangre alterada)']
            },
            'Restos alimentarios': {
                'Tipo': ['Normal', 'Bezoar (especificar)']
            },
            'Fluidos': {
                'Aspecto': ['Claro', 'Excesivo', 'Bilioso']
            },
            'Cuerpo Extraño': {
                'Tipo': ['(especificar)']
            },
            'Prótesis': {
                'Tipo': ['(especificar)']
            }
        },
        'Mucosa': {
            'Eritematosa (Hiperémica)': {
                'Extensión': ['Localizada', 'Parcheada', 'A tiras', 'Difusa']
            },
            'Congestiva (Edematosa)': {
                'Extensión': ['Localizada', 'Parcheada', 'Difusa'],
                'Sangrado': ['Si', 'No'],
                'Estigmas de sangrado': ['Si', 'No']
            },
            'Granular': {
                'Extensión': ['Localizada', 'Parcheada', 'Difusa']
            },
            'Friable': {
                'Extensión': ['Localizada', 'Parcheada', 'Difusa'],
                'Sangrado': ['Si: espontáneo', 'Si: al contacto', 'No']
            },
            'Nodular': {
                'Extensión': ['Localizada', 'Parcheada', 'Difusa']
            },
            'Atrófica / Metaplasia': {
                'Extensión': ['Localizada', 'Parcheada', 'Difusa'],
                'Clasificación Kimura-Takemoto': ['C-I', 'C-II', 'C-III', 'O-I', 'O-II', 'O-III'],
                'Sistema OLGA/OLGIM (Biopsia)': ['Estadio I', 'Estadio II', 'Estadio III', 'Estadio IV']
            },
            'Hemorrágica': {
                'Extensión': ['Localizada', 'Parcheada', 'Difusa']
            },
            'Petequias': {
                'Número': ['Única', 'Pocas', 'Múltiples']
            }
        },
        'Lesiones Planas': {
            'Mancha (área)': {
                'Extensión': ['Localizada', 'Parcheada', 'Difusa'],
                'Número': ['Única', 'Pocas', 'Múltiples'],
                'Sangrado': ['Si', 'Subepitelial', 'No'],
                'Estigmas de sangrado': ['Si', 'No']
            },
            'Lesión de Dieulafoy': {
                'Sangrado': ['Si: a chorro', 'Si: rezumado', 'No'],
                'Estigmas de sangrado': ['Si', 'No']
            },
            'Angioectasia': {
                'Número': ['Única', 'Pocas', 'Múltiples'],
                'Extensión': ['Localizada', 'Parcheada', 'Difusa'],
                'Sangrado': ['Si', 'No'],
                'Estigmas de sangrado': ['Si', 'No']
            }
        },
        'Lesiones Protruyentes': {
            'Pliegues engrosados': {
                'Extensión': ['Localizada', 'Difusa'],
                'Tipo': ['Grueso', 'Gigante']
            },
            'Pápula (Nódulo)': {
                'Número': ['Única', 'Pocas', 'Múltiples'],
                'Sangrado': ['Si', 'No']
            },
            'Pólipo': {
                'Número': ['Única', 'Pocas', 'Múltiples'],
                'Pedículo': ['Sésil', 'Pediculado'],
                'Tamaño': ['Pequeño (< 5 mm)', 'Mediano (5-20 mm)', 'Grande (> 20 mm)'],
                'Sangrado': ['Si', 'No'],
                'Estigmas de sangrado': ['Si', 'No']
            },
            'Tumor / Masa': {
                'Tamaño': ['Pequeña', 'Mediana', 'Grande', 'Diámetro en mm (especificar)'],
                'Clasificación Borrmann': ['I (Polipoideo)', 'II (Ulcerado)', 'III (Ulcerado infiltrante)', 'IV (Linitis plástica)'],
                'Tipo': ['Submucoso', 'Vegetante', 'Ulcerado', 'Infiltrante'],
                'Circunferencial': ['Si', 'No'],
                'Sangrado': ['Si: a chorro', 'Si: rezumado', 'No'],
                'Estigmas de sangrado': ['Si', 'No']
            },
            'Varices': {
                'Sangrado': ['Si: a chorro', 'Si: rezumado', 'No'],
                'Estigmas de sangrado': ['Si', 'No']
            },
            'Granuloma por sutura': []
        },
        'Lesiones Excavadas': {
            'Úlcera Gástrica': {
                'Clasificación Forrest': ['Ia (Chorro)', 'Ib (Babeante)', 'IIa (Vaso visible)', 'IIb (Coágulo)', 'IIc (Mancha)', 'III (Base limpia)'],
                'Tamaño (mm)': ['(especificar)'],
                'Sangrado': ['Si: a chorro', 'Si: rezumado', 'No']
            },
            'Erosiones': {
                'Número': ['Única', 'Pocas', 'Múltiples'],
                'Fondo': ['Limpio', 'Hematina', 'Sangrado activo']
            }
        }
    },
    'Duodeno': {
        'Normal': [],
        'Luz': {
            'Estenosis': {
                'Aspecto': ['Extrínseca', 'Benigna intrínseca', 'Maligna intrínseca'],
                'Sobrepasable': ['Si', 'No']
            },
            'Deformidad': {
                'Aspecto': ['Extrínseco', 'Post-Ulcerosa']
            },
            'Evidencia de cirugía previa': {
                'Detalle': ['(especificar)'],
                'Material de sutura visible': ['Si', 'No']
            }
        },
        'Contenido': {
            'Sangre': {
                'Aspecto': ['Roja', 'Coágulo', 'Hematina (sangre alterada)']
            },
            'Parásitos': ['(especificar)'],
            'Cuerpo Extraño': ['(especificar)'],
            'Prótesis': {
                'Tipo': ['(especificar)']
            }
        },
        'Mucosa': {
            'Eritematosa (Hiperémica)': {
                'Extensión': ['Localizada', 'Parcheada', 'Difusa'],
                'Sangrado': ['Si', 'No'],
                'Estigmas de sangrado': ['Si', 'No']
            },
            'Congestiva (Edematosa)': {
                'Extensión': ['Localizada', 'Parcheada', 'Difusa'],
                'Sangrado': ['Si', 'No'],
                'Estigmas': ['Si', 'No']
            },
            'Granular': { 'Extensión': ['Localizada', 'Parcheada', 'Difusa'] },
            'Friable': {
                'Extensión': ['Localizada', 'Parcheada', 'Difusa'],
                'Sangrado': ['Si: Espontáneo', 'Si: Sangrado al contacto', 'No']
            },
            'Nodular': { 'Extensión': ['Localizada', 'Difusa'] },
            'Atrófica (Enf. Celíaca)': { 
                'Extensión': ['Localizada', 'Parcheada', 'Difusa'],
                'Clasificación visual Marsh': ['Normal (0)', 'Patrón de mosaico (I-II)', 'Festoneado/Atrofia parcial (IIIa-b)', 'Atrofia total (IIIc)']
            },
            'Hemorrágica': {
                'Extensión': ['Localizada', 'Parcheada', 'Difusa'],
                'Sangrado': ['Si', 'No'],
                'Estigmas': ['Si', 'No']
            }
        },
        'Lesiones Planas': {
            'Mancha (área)': {
                'Número': ['Única', 'Pocas', 'Múltiples'],
                'Extensión': ['Localizada', 'Parcheada', 'Difusa'],
                'Sangrado': ['Si', 'No'],
                'Aspecto': ['Subepitelial', 'Teñido de Hematina (Sangre alterada)']
            },
            'Angioectasia': {
                'Número': ['Única', 'Pocas', 'Múltiples'],
                'Extensión': ['Localizada', 'Parcheada', 'Difusa'],
                'Sangrado': ['Si', 'No'],
                'Estigmas': ['Si', 'No']
            }
        },
        'Lesiones Protruyentes': {
            'Pólipo(s)': {
                'Número': ['Único', 'Pocos', 'Múltiples'],
                'Tamaño': ['Pequeño (< 5 mm)', 'Mediano (5-20 mm)', 'Grande (> 20 mm)'],
                'Pedículo': ['Sésil', 'Pediculado'],
                'Sangrado': ['Si', 'No']
            },
            'Tumor/Masa': {
                'Tamaño': ['Pequeño', 'Mediano', 'Grande', '(especificar diámetro mayor en mm)'],
                'Tipo': ['Submucoso', 'Vegetante', 'Ulcerado', 'Infiltrante', 'Velloso'],
                'Sangrado': ['Si: a chorro', 'Si: rezumado', 'No'],
                'Estigmas de sangrado': ['Si', 'No']
            }
        },
        'Lesiones Excavadas': {
            'Erosión': {
                'Número': ['Única', 'Pocas', 'Múltiples'],
                'Extensión': ['Localizada', 'Segmentaria', 'Difusa'],
                'Sangrado': ['Si', 'No'],
                'Estigmas': ['Si', 'No']
            },
            'Úlcera': {
                'Número': ['(especificar)'],
                'Tamaño': ['(especificar diámetro mayor en mm)'],
                'Forma': ['Superficial', 'Crateriforme', 'Lineal'],
                'Sangrado': ['Si: a chorro', 'Si: rezumado', 'No'],
                'Estigmas de sangrado': ['Vaso visible', 'Coágulo', 'No estigmas'],
                'Material pigmentado': ['Si', 'No']
            }
        },
        'Otros': {
            'Cicatriz': { 'Número': ['Única', 'Múltiples'] },
            'Divertículo': { 'Orificio': ['Grande', 'Pequeño'] },
            'Fístula': ['(especificar)']
        }
    },
    'Yeyuno': {
        'Normal': [],
        'Luz': {
            'Estenosis': {
                'Aspecto': ['Extrínseca', 'Benigna intrínseca', 'Maligna intrínseca'],
                'Sobrepasable': ['Si', 'No']
            },
            'Deformidad': {
                'Aspecto': ['Extrínseco', 'Post-Ulcerosa']
            },
            'Evidencia de cirugía previa': {
                'Detalle': ['(especificar)'],
                'Material de sutura visible': ['Si', 'No']
            }
        },
        'Contenido': {
            'Sangre': {
                'Aspecto': ['Roja', 'Coágulo', 'Hematina (sangre alterada)']
            },
            'Parásitos': ['(especificar)'],
            'Cuerpo Extraño': ['(especificar)'],
            'Prótesis': {
                'Tipo': ['(especificar)']
            }
        },
        'Mucosa': {
            'Eritematosa (Hiperémica)': {
                'Extensión': ['Localizada', 'Parcheada', 'Difusa'],
                'Sangrado': ['Si', 'No'],
                'Estigmas de sangrado': ['Si', 'No']
            },
            'Congestiva (Edematosa)': {
                'Extensión': ['Localizada', 'Parcheada', 'Difusa'],
                'Sangrado': ['Si', 'No'],
                'Estigmas': ['Si', 'No']
            },
            'Granular': { 'Extensión': ['Localizada', 'Parcheada', 'Difusa'] },
            'Friable': {
                'Extensión': ['Localizada', 'Parcheada', 'Difusa'],
                'Sangrado': ['Si: Espontáneo', 'Si: Sangrado al contacto', 'No']
            },
            'Nodular': { 'Extensión': ['Localizada', 'Difusa'] },
            'Atrófica': { 'Extensión': ['Localizada', 'Parcheada', 'Difusa'] },
            'Hemorrágica': {
                'Extensión': ['Localizada', 'Parcheada', 'Difusa'],
                'Sangrado': ['Si', 'No'],
                'Estigmas': ['Si', 'No']
            }
        },
        'Lesiones Planas': {
            'Mancha (área)': {
                'Número': ['Única', 'Pocas', 'Múltiples'],
                'Extensión': ['Localizada', 'Parcheada', 'Difusa'],
                'Sangrado': ['Si', 'No'],
                'Aspecto': ['Subepitelial', 'Teñido de Hematina (Sangre alterada)']
            },
            'Angioectasia': {
                'Número': ['Única', 'Pocas', 'Múltiples'],
                'Extensión': ['Localizada', 'Parcheada', 'Difusa'],
                'Sangrado': ['Si', 'No'],
                'Estigmas': ['Si', 'No']
            }
        },
        'Lesiones Protruyentes': {
            'Pólipo(s)': {
                'Número': ['Único', 'Pocos', 'Múltiples'],
                'Tamaño': ['Pequeño (< 5 mm)', 'Mediano (5-20 mm)', 'Grande (> 20 mm)'],
                'Pedículo': ['Sésil', 'Pediculado'],
                'Sangrado': ['Si', 'No']
            },
            'Tumor/Masa': {
                'Tamaño': ['Pequeño', 'Mediano', 'Grande', '(especificar diámetro mayor en mm)'],
                'Tipo': ['Submucoso', 'Vegetante', 'Ulcerado', 'Infiltrante', 'Velloso'],
                'Sangrado': ['Si: a chorro', 'Si: rezumado', 'No'],
                'Estigmas de sangrado': ['Si', 'No']
            }
        },
        'Lesiones Excavadas': {
            'Erosión': {
                'Número': ['Única', 'Pocas', 'Múltiples'],
                'Extensión': ['Localizada', 'Segmentaria', 'Difusa'],
                'Sangrado': ['Si', 'No'],
                'Estigmas': ['Si', 'No']
            },
            'Úlcera': {
                'Número': ['(especificar)'],
                'Tamaño': ['(especificar diámetro mayor en mm)'],
                'Forma': ['Superficial', 'Crateriforme', 'Lineal'],
                'Sangrado': ['Si: a chorro', 'Si: rezumado', 'No'],
                'Estigmas de sangrado': ['Vaso visible', 'Coágulo', 'No estigmas'],
                'Material pigmentado': ['Si', 'No']
            }
        },
        'Otros': {
            'Cicatriz': { 'Número': ['Única', 'Múltiples'] },
            'Divertículo': { 'Orificio': ['Grande', 'Pequeño'] },
            'Fístula': ['(especificar)']
        }
    },
    'Exploración': {
        'Preparación': {
            'Método': ['(especificar)'],
            'Cualidad': [
                'Excelente', 
                'Adecuada', 
                'Inadecuada (especificar)', 
                'Exploración Completa', 
                'Imposibilita una exploración completa'
            ]
        },
        'Extensión': {
            'Situación': ['(especificar)']
        },
        'Limitación': {
            'Motivo': [
                'Adherencias', 
                'Estenosis', 
                'Mala preparación', 
                'Problemas técnicos', 
                'Otro (especificar)'
            ]
        }
    },
    'Procedimientos': {
        'Diagnósticos': {
            'Biopsia': {
                'Lugar(es)': ['(especificar)'],
                'Instrumento': ['Pinza', 'Asa'],
                'Método': ['Fría', 'Caliente'],
                'Espécimen': ['Histología', 'Microbiología', 'Test Helicobacter pylori']
            },
            'Citología': { 
                'Lugar(es)': ['(especificar)'],
                'Lesión': ['(especificar)'] 
            },
            'Cromoscopia': {
                'Lugar(es)': ['(especificar)'],
                'Tipo': ['Tinción por spray', 'Tinción'],
                'Colorante': ['(especificar)']
            },
            'Aspirado de líquidos': [],
            'Fluoroscopia': { 'Tipo': ['(especificar)'] },
            'Colangioscopia': { 'Tipo': ['(especificar)'] },
            'Ultrasonografía endoscópica': { 'Tipo': ['(especificar)'] },
            'Extracción de cuerpo extraño': { 'Tipo': ['(especificar)'] },
            'Polipectomía': {
                'Lugar(es)': ['(especificar)'],
                'Instrumento': ['Pinza', 'Asa'],
                'Método': ['Fría', 'Caliente'],
                'Resultado': ['Completa', 'Incompleta'],
                'Recuperación del pólipo': ['Recuperado', 'No recuperado']
            }
        },
        'Terapéuticos': {
            'Esfinterotomía': {
                'Precorte': ['Si', 'No'],
                'Resultado': ['Satisfactoria', 'Insatisfactoria']
            },
            'Extracción de cálculos': {
                'Resultado': ['Completa', 'Incompleta', 'Insatisfactoria']
            },
            'Litotripsia': {
                'Tipo': ['(especificar)'],
                'Resultado': ['Satisfactoria', 'Insatisfactoria']
            },
            'Quistostomía': {
                'Tipo': ['Transgástrica', 'Transduodenal']
            },
            'Colocación de hilo-guía': {
                'Tipo': ['(especificar)'],
                'Resultado': ['Satisfactorio', 'Insatisfactorio']
            },
            'Colocación de drenaje o sonda': {
                'Tipo': ['Nasobiliar', 'Nasoquístico', 'Nasoentérico', 'Nasopancreático']
            },
            'Prótesis': {
                'Resultado': ['Satisfactorio', 'Insatisfactorio']
            },
            'Gastrostomía (PEG)': {
                'Tipo': ['(especificar)'],
                'Forma extracción': ['Externa', 'Interna'],
                'Resultado': ['Satisfactorio', 'Insatisfactorio']
            },
            'Dilatación': {
                'Lugar(es)': ['(especificar)'],
                'Tipo': ['Bujías con guía', 'Bujías sin guía', 'Balón'],
                'Tamaño (French/gauge)': ['(especificar)'],
                'Resultado': ['Satisfactorio', 'Insatisfactorio']
            },
            'Inyección': {
                'Lugar(es)': ['(especificar)'],
                'Lesión': ['(especificar)'],
                'Material inyectado': ['(especificar)'],
                'Volumen': ['(especificar)'],
                'Motivo': ['Hemostasia', 'Erradicación de varices', 'Destrucción tumoral', 'Depósito de fármacos'],
                'Resultado': ['Satisfactorio', 'Insatisfactorio']
            },
            'Ligaduras': {
                'Lugar(es)': ['(especificar)'],
                'Tipo': ['(especificar)'],
                'Número': ['(especificar)'],
                'Resultado': ['Satisfactorio', 'Insatisfactorio']
            },
            'Colocación prótesis': {
                'Lugar(es)': ['(especificar)'],
                'Tipo': ['(especificar)'],
                'Longitud': ['(especificar)'],
                'Diámetro': ['(especificar)'],
                'Resultado': ['Satisfactorio', 'Insatisfactorio']
            },
            'Resección mucosa': {
                'Lugar(es)': ['(especificar)'],
                'Tipo': ['(especificar)'],
                'Lesión': ['(especificar)'],
                'Resultado': ['Satisfactorio', 'Insatisfactorio']
            },
            'Terapéutica Térmica': {
                'Tipo': ['Coagulación', 'Vaporización', 'Eléctrico monopolar', 'Eléctrico bipolar', 'Láser', 'Argón beam'],
                'Motivo': ['Hemostasia', 'Destrucción tisular', 'Destrucción tumoral'],
                'Resultado': ['Satisfactorio', 'Insatisfactorio']
            }
        }
    }
};

const wgoLocations = {
    'Esófago': [
        'Crico-faringe',
        'Tercio superior',
        'Tercio medio',
        'Tercio inferior',
        'Cardias',
        'Totalidad del esófago',
        'Anastomosis'
    ],
    'Estómago': {
        'Cardias': [],
        'Fundus': ['Curvatura Mayor', 'Curvatura Menor', 'Pared anterior', 'Pared posterior'],
        'Cuerpo': ['Curvatura Mayor', 'Curvatura Menor', 'Pared anterior', 'Pared posterior'],
        'Incisura angularis': [],
        'Antro': ['Curvatura Mayor', 'Curvatura Menor', 'Pared anterior', 'Pared posterior'],
        'Pre-pilórica': [],
        'Píloro': [],
        'Totalidad del estómago': [],
        'Anastomosis': [],
        'Piloroplastia': []
    },
    'Duodeno': {
        'Bulbo': ['Anterior', 'Posterior', 'Proximal', 'Distal'],
        '2º porción del duodeno': [],
        'Área papilar': [],
        'Anastomosis': [],
        'Totalidad del duodeno examinado': []
    },
    'Yeyuno': [
        'Asa aferente yeyunal',
        'Asa eferente yeyunal',
        'Carina yeyunal'
    ],
    'Exploración': [
        'General',
        'Esófago',
        'Estómago',
        'Duodeno',
        'Yeyuno',
        'Anastomosis'
    ],
    'Procedimientos': [
        'Esófago',
        'Estómago',
        'Duodeno',
        'Yeyuno',
        'General'
    ]
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
        'Preoperatoria', 'Post-quirúrgica', 'Escrutinio', 
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
            'Úlcera': diagAttrs
        },
        'Otros diagnósticos': [
            'Acalasia', 'Tumor benigno', 'Divertículo', 'Fístula', 'Cuerpo Extraño', 
            'Hernia de hiato', 'Síndrome de Mallory-Weiss', 'Esofagitis candidíásica', 
            'Esofagitis sin reflujo', 'Pólipo', 'Aspecto Post-quirúrgico', 
            'Aspecto post-escleroterapia', 'Cicatriz', 'Anillo de Schatzki', 'Tumor submucoso'
        ]
    },
    'Estómago': {
        'Diagnóstico principal': {
            'Normal': [],
            'Gastropatía Erosiva': diagAttrs,
            'Gastropatía Eritematosa (Hiperémica)': diagAttrs,
            'Gastropatía Hipertrófica': diagAttrs,
            'Gastropatía Hemorrágica': diagAttrs,
            'Mucosa gástrica atrófica': diagAttrs,
            'Sospecha de gastritis': diagAttrs,
            'Gastropatía de la hipertensión portal': diagAttrs,
            'Úlcera gástrica': diagAttrs,
            'Úlcera gástrica sangrante': {
                'Atributos Generales': diagAttrs,
                'Clasificación de Forrest': forrestAttrs
            },
            'Úlcera anastomótica': diagAttrs,
            'Tumor maligno (especificar)': diagAttrs,
            'Pólipos': diagAttrs
        },
        'Otros diagnósticos': [
            'Angioectasia', 'Tumor benigno', 'Sangrado de origen desconocido', 
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
            'Úlcera duodenal': diagAttrs,
            'Úlcera duodenal sangrante': {
                'Atributos Generales': diagAttrs,
                'Clasificación de Forrest': forrestAttrs
            },
            'Deformidad ulcerogénica del duodeno': diagAttrs
        },
        'Otros diagnósticos': [
            'Angioectasia', 'Tumor benigno de origen desconocido', 
            'Hiperplasia de glándulas de Brunner', 'Enfermedad celíaca', 
            'Enfermedad de Crohn', 'Divertículo', 'Fístula', 'Tumor maligno', 
            'Parásitos', 'Pólipo(s)', 'Cambios Post-quirúrgicos', 'Cicatriz', 
            'Tumor submucoso', 'Otro (Especificar)'
        ]
    },
    'Yeyuno': {
        'Diagnóstico principal': {
            'Normal': [],
            'Yeyunitis': diagAttrs,
            'Atrofia vellositaria': diagAttrs,
            'Angiectasias': diagAttrs
        },
        'Otros diagnósticos': [
            'Pólipo', 'Úlcera', 'Tumor', 'Sangrado activo', 'Cambios post-quirúrgicos'
        ]
    }
};

