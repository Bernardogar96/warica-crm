# Guía de Configuración — Warica CRM

## ✅ Estado actual

- **Calendar webhook:** DESPLEGADO y probado end-to-end ✓
  URL: `https://script.google.com/macros/s/AKfycbxHpw8QLYnpjF1goCvScy7J4vABWnXLzOF9HYK6fPpLT3wgMVjlcoWF8q0Qst9F0pMO/exec`
  Calendar ID: `c_93303231d97975c4a57f9bb1c8254eeae07b118fa4bf39ac185e9cc4728d99d3@group.calendar.google.com`
  Ya configurado en `.env` como `VITE_GCAL_WEBHOOK_URL`
- **Forms webhook:** pendiente (requiere acción manual — ver sección 2)
- **Dominio abuelo.mx:** pendiente (requiere acción en GoDaddy + Vercel — ver sección 3)

> ⚠️ **Importante:** el `.env` local ya tiene la URL. Para que funcione en producción, también debes agregar `VITE_GCAL_WEBHOOK_URL` en **Vercel → Settings → Environment Variables** y redeployar.

---

## 1. Google Calendar (Eventos Confirmados) — Integración API

Cuando un evento pasa a "Confirmado" (vía drag en Kanban, dropdown en Listado, o guardar en el modal de edición), aparece un popup preguntando "¿Enviarlo a Google Calendar?". Al confirmar, el evento se crea **automáticamente** en el Google Calendar de Warica vía un Apps Script Web App.

### Pasos de configuración (una sola vez):

1. **Obtén el Calendar ID** del calendario destino:
   - Abre [Google Calendar](https://calendar.google.com)
   - Click en ⚙ (Configuración) → selecciona el calendario en la barra lateral
   - Scroll hasta "Integrar calendario" → copia el **ID del calendario**
   - Normalmente termina en `@group.calendar.google.com`

2. **Crea el Apps Script Web App:**
   - Con la cuenta **administradora del calendario**, ve a [script.google.com](https://script.google.com) → Nuevo proyecto
   - Borra el contenido y pega TODO el archivo `google-calendar-webhook.js`
   - Reemplaza `PON_TU_CALENDAR_ID_AQUI@group.calendar.google.com` con el Calendar ID del paso 1
   - Guarda con Ctrl+S (ponle un nombre como "Warica Calendar Webhook")

3. **Publica como Web App:**
   - Click "Implementar" (Deploy) → Nueva implementación
   - Tipo: **Aplicación web**
   - Ejecutar como: **Yo** (la cuenta admin)
   - Quién tiene acceso: **Cualquier usuario** ← importante
   - Click "Implementar"
   - **Autoriza los permisos** (verás una advertencia de Google, es normal — click "Avanzado" → "Ir a \[nombre del proyecto]")
   - **Copia la URL** que te muestra (termina en `/exec`)

4. **Prueba el deploy:**
   - En el editor de Apps Script, selecciona la función `testCreateEvent` y click ejecutar
   - Revisa que aparezca un nuevo evento en tu Google Calendar

5. **Conecta el CRM con el Web App:**
   - Edita el archivo `.env` de warica-crm
   - Pega la URL: `VITE_GCAL_WEBHOOK_URL=https://script.google.com/macros/s/XXXXX/exec`
   - Si el CRM está en Vercel: ve a Settings → Environment Variables → agrega `VITE_GCAL_WEBHOOK_URL` con la misma URL
   - **Redeploy** en Vercel para que tome la nueva variable

### Cómo usarlo

1. Crea o edita un evento en el pipeline de Eventos Warica
2. Mueve el evento a la columna "Confirmado" (drag en Kanban, dropdown en Listado, o guardar desde el modal)
3. Aparece el popup "¿Enviarlo a Google Calendar?" con los detalles
4. Click "Sí, enviar al Calendar" → el evento se crea automáticamente en el calendario configurado
5. El ID del evento se guarda en la oportunidad para tracking

---

## 2. Google Forms → Pipeline (Webhook)

### Pasos para configurar:

1. **Abre tu Google Form** que llenan los prospectos

2. Ve al menú **⋮ → Editor de secuencias de comandos** (Script Editor)

3. Borra el contenido por defecto y **pega el contenido del archivo** `google-forms-webhook.js`

4. **Edita el `FIELD_MAP`** para que los nombres de la izquierda coincidan con los títulos exactos de las preguntas de tu formulario. Por ejemplo, si tu pregunta dice "¿Cuál es tu empresa?", cambia:
   ```js
   "¿Cuál es tu empresa?": "company",
   ```

5. Opcionalmente cambia `BUSINESS_UNIT` si los leads del formulario no son para "eventos"

6. **Guarda** el script (Ctrl+S)

7. Ve a **Editar → Activadores → + Agregar activador**:
   - Función: `onFormSubmit`
   - Evento: "Al enviar el formulario"
   - Click "Guardar" y autoriza los permisos

8. **Prueba:** Ejecuta la función `testConnection()` desde el editor para verificar que la conexión a Supabase funciona. Revisa los logs en Ver → Registros.

### ¿Cómo funciona?

Cada vez que alguien llena el formulario, se crea una nueva oportunidad en el pipeline con:
- Etapa: "Backlog" (primer paso del pipeline)
- Fuente: "google_forms" (aparece un badge "Forms" en las tarjetas del Kanban)
- Todos los datos mapeados del formulario

---

## 3. Dominio abuelo.mx (GoDaddy → Vercel)

### Paso 1: Agregar dominio en Vercel

1. Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecciona el proyecto **warica-crm**
3. Ve a **Settings → Domains**
4. Escribe `abuelo.mx` y click **Add**
5. También agrega `www.abuelo.mx` (Vercel te preguntará si quieres redirigir www → apex o viceversa)

### Paso 2: Configurar DNS en GoDaddy

1. Entra a [GoDaddy](https://dcc.godaddy.com/) → **Mis Dominios** → `abuelo.mx` → **DNS**
2. **Elimina** cualquier registro A y CNAME existente para `@` y `www`
3. **Agrega estos registros:**

| Tipo  | Nombre | Valor                   | TTL     |
|-------|--------|-------------------------|---------|
| A     | @      | `76.76.21.21`           | 600     |
| CNAME | www    | `cname.vercel-dns.com`  | 600     |

4. Guarda los cambios

### Paso 3: Verificar

- Espera 5-10 minutos (propagación DNS)
- Vuelve a **Vercel → Settings → Domains** y verifica que aparezca "Valid Configuration" con un check verde
- Vercel configurará automáticamente SSL/HTTPS
- Visita `https://abuelo.mx` para confirmar que funciona

### Nota sobre propagación DNS
Los cambios de DNS pueden tardar hasta 48 horas en propagarse globalmente, aunque generalmente es mucho más rápido (5-30 minutos).
