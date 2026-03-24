const mstTree = {
    'Esófago': {
        'Luz': {
            'Normal': [],
            'Dilatada': [],
            'Estenosis': {
                'Aspecto': ['Extrínseca', 'Benigna intrínseca', 'Maligna intrínseca'],
                'Longitud (cm)': ['(especificar)'],
                'Sobrepable': ['Si', 'Tras dilatación', 'No']
            },
            'Compresión Extrínseca': {
                'Tamaño': ['Pequeña', 'Grande']
            },
            'Membrana': [],
            'Anillo (incluye Schatzki)': [],
            'Hernia de Hiato': {
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
                'Grado (Savary-Miller)': ['Grado I', 'Grado II', 'Grado III', 'Grado IV'],
                'Sangrado': ['Si', 'No']
            },
            'Esófago de Barrett': {
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
                'Ulcera': {
                    'Tamaño (mm)': ['(especificar)'],
                    'Sangrado': ['Si: a chorro', 'Si: rezumado', 'No'],
                    'Estigmas de sangrado': ['Si', 'No']
                }
            }
        },
        'Otros': ['Cicatriz', 'Divertículo', 'Fístula']
    },
    'Estómago': {
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
            'Atrófica': {
                'Extensión': ['Localizada', 'Parcheada', 'Difusa']
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
            'Ulcera Gástrica': {
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
    },
    'Yeyuno': {
        'Lumen': ['Normal', 'Estenosis', 'Divertículo', 'Sangre'],
        'Mucosa': ['Normal', 'Eritema', 'Atrofia (Celiaquía?)', 'Nodularidad'],
        'Lesiones': ['Pólipo', 'Úlcera', 'Angiectasia']
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

