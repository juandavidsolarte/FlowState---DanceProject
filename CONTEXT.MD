# Contexto Principal: Proyecto FlowState

## 1. Arquitectura y Entorno
Este es un proyecto Full-Stack estructurado en dos directorios principales aislados:
- **/backend**: Aplicación en Django. El entorno virtual (`venv`) se encuentra estrictamente dentro de esta carpeta, no en la raíz del proyecto.
- **/frontend**: Aplicación React construida con Vite. 

## 2. Stack Tecnológico Principal
- **Frontend**: React, Tailwind CSS (configurado por defecto), Framer Motion (para animaciones complejas/scroll), Radix UI / Headless UI (para componentes accesibles), Lucide React (iconografía).
- **Backend**: Django, Django REST Framework, PostgreSQL.
- **Rutas y Assets**: Las imágenes estáticas se importan siempre de forma local desde `../assets/images/`.

## 3. Guía de Interfaz y Diseño
- **Estética Global**: Diseño moderno tipo "Glassmorphism".
- **Patrones de UI**: Uso de fondos oscurecidos (`backdrop-blur`), tarjetas con elevación al hacer hover (`hover:-translate-y-x`), y gradientes con tonos violeta/fucsia.
- **Responsive**: Diseño *mobile-first* priorizando el uso de Grid y Flexbox de Tailwind.

## 4. REGLAS ESTRICTAS PARA LA IA (IMPORTANTE)
Antes de generar o sugerir cualquier bloque de código, DEBES cumplir con lo siguiente:
1. **Verificar Existencia**: Asume que el proyecto ya tiene componentes y configuraciones base. Pregúntame si un componente, vista o modelo ya existe antes de crear uno nuevo desde cero para no duplicar ni sobrescribir código funcional.
2. **Solicitar Contexto**: Si te pido modificar algo (ej. "ajusta la tarjeta de coreografía"), pídeme que te pegue el código actual de ese archivo si no te lo he proporcionado aún.
3. **Modificaciones Quirúrgicas**: Cuando propongas un cambio en un archivo existente, no me reescribas todo el archivo si es muy largo. Indícame exactamente qué líneas cambiar o qué función reemplazar.
4. **Enfoque de la Sesión**: Limítate a resolver la tarea actual o la historia de usuario específica que te comparta. No te adelantes a implementar lógicas que no se te han pedido.

## 5. Protocolo de Inicio (Confirmación de Lectura)
Cada vez que recibas este archivo al inicio de una nueva sesión, debes confirmar que has leído y entendido todas las reglas anteriores. Para hacerlo, tu primera y única respuesta debe ser EXACTAMENTE esta frase:

"✅ **Contexto FlowState asimilado.** Mis directivas están claras. ¿Con qué componente empezamos hoy, Juan?"

No agregues saludos adicionales, ni resúmenes, ni explicaciones en ese primer mensaje. Solo imprime esa frase y espera mi siguiente instrucción.