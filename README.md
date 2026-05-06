# Aplicación de Endoscopia

Una herramienta clínica avanzada para facilitar la creación estructurada de reportes endoscópicos.

[![Deploys by Netlify](https://www.netlify.com/img/deploy/button.svg)](https://www.netlify.com)

## Características principales
* Creación de reportes clínicos en formato estructurado de endoscopia.
* Integración con bases de datos PostgreSQL para resguardar historiales.
* Flujos automáticos de copias de seguridad de los datos diariamente.
* Diseñada para endoscopistas.
* Diseño moderno y adaptable al móvil.

## Despliegue

Este proyecto se despliega de manera automática y gratuita utilizando [Netlify](https://www.netlify.com), que impulsa con gran rapidez la conectividad de la aplicación visual.

## Configuración segura local

1. Copia `backend/.env.example` a `backend/.env`.
2. Configura valores reales para `DATABASE_URL`, `JWT_SECRET` y `DEFAULT_ADMIN_PASSWORD`.
3. Nunca subas `backend/.env` al repositorio.
4. Ejecuta `node backend/init_db.js` para crear el usuario admin inicial con la contraseña definida en `DEFAULT_ADMIN_PASSWORD`.
5. Cambia la contraseña del admin después del primer inicio de sesión.

## Licencia

Este proyecto está bajo la Licencia MIT - mira el archivo [LICENSE](LICENSE) para más detalles.

## Código de Conducta

Por favor, lee nuestro [Código de Conducta](CODE_OF_CONDUCT.md) para conocer las normas de participación y comportamiento en la comunidad de este proyecto de código abierto.
