const mstTree = {
    'Esófago': {
        'Lumen': ['Estenosis', 'Dilatación', 'Deformidad', 'Normal'],
        'Contenidos': ['Alimento', 'Sangre', 'Cuerpo Extraño', 'Claro'],
        'Mucosa': {
            'Normal': [],
            'Esofagitis': ['Los Ángeles A', 'Los Ángeles B', 'Los Ángeles C', 'Los Ángeles D'],
            'Esófago de Barrett': ['Praga C0M1', 'Praga C1M2', 'Praga C2M4'],
            'Várices': ['Grado I', 'Grado II', 'Grado III']
        },
        'Sangrado': ['Activo', 'Reciente', 'Sin sangrado']
    },
    'Estómago': {
        'Lumen': ['Hernia Hiatal', 'Deformidad bulbar', 'Normal'],
        'Contenidos': ['Bilis', 'Sangre Roja', 'Posos de café', 'Claro'],
        'Mucosa': {
            'Eritema / Gastritis': ['Antral', 'Corporal', 'Pangastritis'],
            'Úlcera': {
                'Forrest Ia': ['Sangrado arterial a chorro'],
                'Forrest Ib': ['Sangrado babeante'],
                'Forrest IIa': ['Vaso visible'],
                'Forrest IIb': ['Coágulo adherido'],
                'Forrest IIc': ['Mancha pigmentada plana'],
                'Forrest III': ['Base limpia']
            },
            'Pólipo': ['Sésil', 'Pediculado', 'De aspecto hiperplásico']
        }
    },
    'Duodeno': {
        'Lumen': ['Deformidad pseudodiverticular', 'Normal'],
        'Mucosa': ['Úlcera', 'Erosiones', 'Atrofia vellositaria', 'Aspecto nodular', 'Normal']
    }
};
