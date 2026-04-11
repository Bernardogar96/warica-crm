/**
 * Google Apps Script — Webhook para enviar respuestas de Google Forms a Warica CRM (Supabase)
 *
 * INSTRUCCIONES DE CONFIGURACIÓN:
 * ─────────────────────────────────
 * 1. Abre tu Google Form → menú ⋮ → Editor de secuencias de comandos (Script Editor)
 * 2. Borra el contenido por defecto y pega TODO este archivo
 * 3. Configura las variables SUPABASE_URL y SUPABASE_ANON_KEY abajo
 * 4. Configura FIELD_MAP con los nombres exactos de tus preguntas del formulario
 * 5. Guarda el script (Ctrl+S)
 * 6. En el menú: Editar → Activadores del proyecto actual → + Agregar activador
 *    - Función: onFormSubmit
 *    - Evento: Al enviar el formulario
 *    - Click "Guardar" y autoriza los permisos
 *
 * Cada vez que alguien llene el formulario, se creará automáticamente una nueva
 * oportunidad en el pipeline de Warica CRM como lead en "Backlog".
 */

// ══════════════ CONFIGURACIÓN ══════════════

const SUPABASE_URL = "https://rijyyucrrbkcyovmxpby.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpanl5dWNycmJrY3lvdm14cGJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzM3NjQsImV4cCI6MjA5MTE0OTc2NH0.GoKUs-tbyZY6MjHMtOimeevSA-G-yDeJQ_aUKt6H3p0";

// Unidad de negocio donde entrarán los leads del formulario
const BUSINESS_UNIT = "eventos"; // "eventos" | "proyectos" | "excursiones"

// Mapeo de preguntas del formulario → campos del CRM
// Los títulos de la izquierda coinciden EXACTAMENTE con las preguntas del form de Warica Eventos
const FIELD_MAP = {
  "Email":                                        "email",
  "Nombre completo del responsable del evento":   "contact",
  "Teléfono de contacto":                         "phone",
  "Nombre de tu empresa, colegio u organización": "company",
  "Número de participantes":                      "attendees",
  "Fecha(s) que tienes en mente para tu evento":  "eventDateTime",
  "¿Qué tipo de evento te interesa realizar?":    "projectName",
  "¿Qué tipo de grupo es?":                       "orgType",
  "¿Hay algo especial que debamos considerar?":   "notes",
};

// ══════════════ NO MODIFICAR DEBAJO ══════════════

function onFormSubmit(e) {
  try {
    // Construir el objeto de respuestas de forma que funcione con ambos tipos de trigger:
    //  - "From form" (directo):       e.response (FormResponse)
    //  - "From spreadsheet" (enlazado): e.namedValues ({ "Pregunta": ["Respuesta"] })
    let responses = {};

    if (e && e.response && typeof e.response.getItemResponses === "function") {
      // Trigger configurado desde el formulario directamente
      const itemResponses = e.response.getItemResponses();
      for (const ir of itemResponses) {
        const title = ir.getItem().getTitle();
        const answer = ir.getResponse();
        const value = Array.isArray(answer) ? answer.join(", ") : String(answer);
        responses[title] = [value];
      }
    } else if (e && e.namedValues) {
      // Trigger configurado desde un Spreadsheet enlazado
      responses = e.namedValues;
    } else {
      Logger.log("Error: el evento no contiene ni e.response ni e.namedValues. " +
                 "Revisa que el trigger esté configurado como 'On form submit' desde el formulario.");
      return;
    }

    // Construir el objeto de oportunidad
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const id = now.getTime().toString(36) + Math.random().toString(36).slice(2, 7);

    const opp = {
      id: id,
      company: "",
      contact: "",
      email: "",
      phone: "",
      projectName: "",
      eventDateTime: "",
      attendees: "",
      orgType: "",
      startTime: "",
      endTime: "",
      amount: "",
      priority: "Media",
      status: "a_tiempo",
      notes: "",
      stage: "Backlog",
      businessUnit: BUSINESS_UNIT,
      createdAt: todayStr,
      salesperson: "",
      source: "google_forms",
      activities: [],
      history: [{ stage: "Backlog", date: todayStr }],
    };

    // Rellenar campos según el mapeo
    for (const [question, field] of Object.entries(FIELD_MAP)) {
      if (responses[question] && responses[question][0]) {
        let value = responses[question][0].trim();

        // Convertir fecha si es necesario (Google Forms usa formato local)
        if (field === "eventDateTime" && value) {
          try {
            const d = new Date(value);
            if (!isNaN(d.getTime())) {
              value = d.toISOString().slice(0, 10);
            }
          } catch (_) { /* mantener valor original */ }
        }

        // Convertir monto a número si es posible
        if (field === "amount" && value) {
          value = value.replace(/[^0-9.]/g, "");
        }

        opp[field] = value;
      }
    }

    // Agregar todas las respuestas como nota si hay campos no mapeados
    const unmapped = [];
    for (const [question, answers] of Object.entries(responses)) {
      if (!FIELD_MAP[question] && answers[0]) {
        unmapped.push(question + ": " + answers[0]);
      }
    }
    if (unmapped.length > 0) {
      opp.notes = (opp.notes ? opp.notes + "\n\n" : "") +
        "── Datos adicionales del formulario ──\n" + unmapped.join("\n");
    }

    // Insertar en Supabase
    const payload = JSON.stringify({ id: opp.id, data: opp });

    const options = {
      method: "POST",
      contentType: "application/json",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": "Bearer " + SUPABASE_ANON_KEY,
        "Prefer": "return=minimal",
      },
      payload: payload,
      muteHttpExceptions: true,
    };

    const response = UrlFetchApp.fetch(
      SUPABASE_URL + "/rest/v1/opportunities",
      options
    );

    const code = response.getResponseCode();
    if (code >= 200 && code < 300) {
      Logger.log("Lead creado exitosamente: " + opp.id + " (" + (opp.company || opp.projectName) + ")");
    } else {
      Logger.log("Error al crear lead: HTTP " + code + " — " + response.getContentText());
    }

  } catch (error) {
    Logger.log("Error en webhook: " + error.toString());
  }
}

/**
 * Función de prueba — ejecútala manualmente para verificar la conexión
 */
function testConnection() {
  const options = {
    method: "GET",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": "Bearer " + SUPABASE_ANON_KEY,
    },
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(
    SUPABASE_URL + "/rest/v1/opportunities?select=id&limit=1",
    options
  );

  Logger.log("Test — HTTP " + response.getResponseCode());
  Logger.log("Respuesta: " + response.getContentText().slice(0, 200));
}
