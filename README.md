# PLUS VG – Núñez Urban Living | Visual Studio + Administrador

Proyecto ASP.NET Core 8.0 con web pública y panel CMS integrado. No usa base de datos externa ni requiere AutoCAD. La versión pública usa las escenas originales, renders conceptuales de IA y video promocional de la versión 3.0.

## Requisitos

- Windows + Visual Studio 2022 17.8 o superior, con **ASP.NET y desarrollo web** y .NET 8 SDK; o VS Code con .NET 8.
- Navegador Chrome/Edge.

## Inicio rápido sin contraseña

1. Descomprimir el ZIP y abrir `PLUS_VG.sln` en Visual Studio 2022 con .NET 8.
2. Seleccionar el perfil **PLUS VG - Local** y ejecutar con F5.
3. Abrir `http://127.0.0.1:5186/admin.html` para editar sin ingresar clave.
4. Abrir `http://127.0.0.1:5186/` para ver la página pública.

También podés ejecutar `./Iniciar-PLUS-VG.ps1` en PowerShell desde la carpeta del proyecto. No se solicita contraseña ni se requiere configurar variables de entorno.

**Seguridad:** el proyecto está preparado para ejecutarse solo en la computadora local y el backend rechaza acciones de administración desde conexiones remotas. No publiques el servidor a Internet ni cambies la escucha a `0.0.0.0` sin agregar autenticación.

## Edición

En `/admin.html` existen estas pestañas:
- **Textos:** títulos, introducciones, notas.
- **Recorrido 3D:** títulos, textos e imágenes de las 5 escenas.
- **Galería:** imágenes del producto y logo.
- **Video:** reemplazo del MP4 promocional.
- **Finanzas:** cifras de ambos modelos de venta y TIR por horizonte (no se recalculan automáticamente a partir de flujos de fondos).
- **Cronograma:** descripciones y meses de las 6 etapas.
- **Niveles:** nombres y descripciones de pisos y subsuelos.
- **JSON:** edición integral avanzada.

Después de editar, presionar **Guardar cambios** y actualizar la web pública. Las fotos cargadas se almacenan en `wwwroot/uploads/` y las configuraciones en `Data/site.json`. Cada guardado conserva un respaldo en `Data/backups/` (últimos 15).

## Estructura del proyecto

```text
PLUS_VG.sln
PLUS_VG.csproj
Program.cs                     Backend/API ASP.NET Core
Properties/launchSettings.json
Data/site.json                 Contenido editable
Data/backups/                  Historial automático al guardar
wwwroot/index.html             Web pública basada en v3
wwwroot/admin.html             Panel de administración
wwwroot/js/admin.js            Editor
wwwroot/js/overrides.js        Aplica ediciones al sitio
wwwroot/assets/                Imágenes y video incorporados
wwwroot/uploads/               Nuevas imágenes/video desde el panel
```

## Precauciones de exposición

- Las imágenes y recorridos son **recreaciones conceptuales** y no sustituyen planos de proyecto ni ingeniería verificada.
- El transformador de **500 kVA** es una hipótesis de compra/equipamiento de la presentación, no una especificación aprobada.
- El DLM es una demostración orientativa; no controla cargadores físicos.
- Las cifras financieras de ambos modelos están en revisión y requieren conciliación antes de mostrarse como datos definitivos.
- No exponer la administración a Internet sin HTTPS, autenticación persistente, validación adicional y despliegue profesional. El proyecto está pensado para ejecución local durante la defensa.

## Soporte técnico

`GET /api/health` permite verificar que el servidor responde. `GET /api/public/config.js` entrega datos visibles en la web. Las rutas `/api/admin/...` de lectura y edición no requieren contraseña, pero comprueban que la conexión provenga del propio equipo. No habilitar administración remota sin autenticación.
