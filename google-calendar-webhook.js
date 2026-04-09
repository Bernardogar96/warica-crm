/**
 * Google Apps Script Web App — Crear eventos en Google Calendar desde Warica CRM
 *
 * INSTRUCCIONES DE CONFIGURACIÓN:
 * ─────────────────────────────────
 * 1. Con la cuenta que es ADMINISTRADORA del Google Calendar destino,
 *    ve a https://script.google.com → Nuevo proyecto
 *
 * 2. Borra el contenido por defecto y pega TODO este archivo
 *
 * 3. Configura el CALENDAR_ID abajo:
 *    - Abre Google Calendar → Configuración (⚙)
 *    - En la lista lateral, click en el calendario destino
 *    - Scroll hasta "Integrar calendario" → copia el "ID del calendario"
 *    - Normalmente termina en @group.calendar.google.com
 *    - Ej: abc123def456@group.calendar.google.com
 *
 * 4. Guarda (Ctrl+S) y ponle un nombre al proyecto (ej. "Warica Calendar Webhook")
 *
 * 5. Click en "Implementar" (Deploy) arriba a la derecha → Nueva implementación
 *    - Tipo: Aplicación web
 *    - Descripción: "Warica CRM → Calendar"
 *    - Ejecutar como: "Yo" (tu cuenta admin)
 *    - Quién tiene acceso: "Cualquier usuario" (IMPORTANTE — sin esto el CRM no puede llamarlo)
 *    - Click "Implementar"
 *
 * 6. Autoriza los permisos cuando Google lo pida
 *
 * 7. Copia la "URL de la aplicación web" que te muestra (termina en /exec)
 *
 * 8. En el proyecto de Warica CRM, agrega a tu archivo .env:
 *      VITE_GCAL_WEBHOOK_URL=https://script.google.com/macros/s/TU_URL_AQUI/exec
 *
 * 9. Haz redeploy de warica-crm en Vercel para que tome la nueva env var
 *
 * 10. Prueba: ejecuta la función testCreateEvent() desde el editor de Apps Script
 *     y verifica que se crea un evento en el calendar.
 *
 * NOTA DE SEGURIDAD:
 * El Web App queda público (quién tiene acceso = "Cualquier usuario") pero solo
 * puede crear eventos en el calendar configurado, y solo responde a POST con JSON
 * bien formado. Si quieres más seguridad, agrega un SECRET_TOKEN abajo y envíalo
 * desde el CRM como header o campo del payload.
 */

// ══════════════ CONFIGURACIÓN ══════════════

// ID del calendario destino. Obtenlo en Configuración del calendario → Integrar calendario
const CALENDAR_ID = "c_93303231d97975c4a57f9bb1c8254eeae07b118fa4bf39ac185e9cc4728d99d3@group.calendar.google.com";

// Zona horaria de los eventos (México)
const TIMEZONE = "America/Mexico_City";

// Duración por defecto si no hay hora de inicio/fin (en horas)
const DEFAULT_DURATION_HOURS = 2;

// Token opcional para validar requests (si quieres más seguridad, ponlo también en el CRM)
const SECRET_TOKEN = ""; // Deja vacío para no usar token

// ══════════════ WEB APP HANDLERS ══════════════

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);

    // Validar token si está configurado
    if (SECRET_TOKEN && payload.token !== SECRET_TOKEN) {
      return jsonResponse({ ok: false, error: "Token inválido" });
    }

    // Validar datos mínimos
    if (!payload.title) {
      return jsonResponse({ ok: false, error: "Falta el título del evento" });
    }

    // Obtener el calendario
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    if (!calendar) {
      return jsonResponse({
        ok: false,
        error: "No se encontró el calendario. Verifica que CALENDAR_ID sea correcto y que la cuenta tenga acceso.",
      });
    }

    // Construir fechas de inicio y fin
    const { startDate, endDate } = buildEventDates(payload);

    // Construir descripción del evento
    const description = buildDescription(payload);

    // Crear el evento
    const event = calendar.createEvent(
      payload.title,
      startDate,
      endDate,
      {
        description: description,
        location: payload.location || "",
      }
    );

    // Agregar el ID del CRM como propiedad del evento (para tracking)
    if (payload.id) {
      event.setTag("warica_opp_id", payload.id);
    }

    Logger.log("Evento creado: " + event.getId() + " — " + payload.title);

    return jsonResponse({
      ok: true,
      eventId: event.getId(),
      eventUrl: "https://calendar.google.com/calendar/event?eid=" +
                Utilities.base64Encode(event.getId().replace("@google.com", "") + " " + CALENDAR_ID).replace(/=+$/, ""),
      title: payload.title,
    });

  } catch (error) {
    Logger.log("Error en doPost: " + error.toString());
    return jsonResponse({ ok: false, error: error.toString() });
  }
}

// Responde a GET con un mensaje de estado (útil para verificar que el deploy funciona)
function doGet(e) {
  return jsonResponse({
    ok: true,
    message: "Warica Calendar Webhook activo",
    calendarId: CALENDAR_ID,
  });
}

// ══════════════ HELPERS ══════════════

function buildEventDates(payload) {
  const dateStr = payload.eventDate || new Date().toISOString().slice(0, 10);

  let startDate, endDate;

  if (payload.startTime) {
    // Hora explícita
    startDate = parseDateTime(dateStr, payload.startTime);
    if (payload.endTime) {
      endDate = parseDateTime(dateStr, payload.endTime);
    } else {
      endDate = new Date(startDate.getTime() + DEFAULT_DURATION_HOURS * 60 * 60 * 1000);
    }
  } else {
    // Sin hora — crear evento de día completo
    startDate = parseDateTime(dateStr, "09:00");
    endDate = parseDateTime(dateStr, "18:00");
  }

  return { startDate, endDate };
}

function parseDateTime(dateStr, timeStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0);
}

function buildDescription(payload) {
  const lines = [];
  if (payload.company) lines.push("🏢 Cliente: " + payload.company);
  if (payload.contact) lines.push("👤 Contacto: " + payload.contact);
  if (payload.salesperson) lines.push("💼 Vendedor: " + payload.salesperson);
  if (payload.attendees) lines.push("👥 Asistentes: " + payload.attendees);
  if (payload.notes) {
    lines.push("");
    lines.push("📝 Notas:");
    lines.push(payload.notes);
  }
  lines.push("");
  lines.push("─── Creado desde Warica CRM ───");
  if (payload.id) lines.push("ID: " + payload.id);
  return lines.join("\n");
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ══════════════ FUNCIÓN DE PRUEBA ══════════════

function testCreateEvent() {
  const testPayload = {
    id: "test-" + Date.now(),
    title: "Prueba Warica CRM",
    company: "Cliente de Prueba",
    contact: "Juan Pérez",
    salesperson: "Vendedor Demo",
    attendees: "50",
    notes: "Este es un evento de prueba creado desde el editor de Apps Script",
    eventDate: new Date().toISOString().slice(0, 10),
    startTime: "15:00",
    endTime: "17:00",
    location: "Oficina Warica",
  };

  const mockEvent = { postData: { contents: JSON.stringify(testPayload) } };
  const result = doPost(mockEvent);
  Logger.log("Resultado: " + result.getContent());
}
