const getEmailTemplate = (userName, mainMessage, data, link) => {
  const priorityColors = {
    'Baja': '#10b981',    // Verde
    'Media': '#f59e0b',   // Amarillo/Naranja
    'Alta': '#f97316',    // Naranja Oscuro
    'Crítica': '#ef4444'  // Rojo
  };
  
  const pColor = priorityColors[data.prioridad] || '#64748b';

  // Usamos data.eventoDetalle si existe, si no un texto genérico
  const eventDetail = data.evento || "Notificación";

  return `
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family: Arial, Helvetica, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f1f5f9">
    <tr>
      <td align="center" style="padding: 20px;">

        <table width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="max-width:600px; width:100%; border-radius:8px; overflow:hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          
          <tr>
            <td bgcolor="#4f46e5" align="center" style="padding:30px;">
              <h1 style="margin:0; color:#ffffff; font-size:24px; letter-spacing:1px; font-family: 'Segoe UI', Arial, sans-serif;">
                PrimeBug
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:40px;">

              <h2 style="margin:0 0 20px 0; color:#1e293b; font-size:20px; font-family: Arial, sans-serif;">
                Hola, ${userName}
              </h2>

              <p style="color:#475569; font-size:16px; line-height:1.6; margin:0 0 25px 0; font-family: Arial, sans-serif;">
                ${mainMessage}
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0; border-radius:6px; background-color:#f8fafc;">
                
                <tr>
                  <td width="30%" style="padding:12px 20px; border-bottom:1px solid #e2e8f0; color:#64748b; font-size:11px; font-weight:bold; text-transform:uppercase; font-family: Arial, sans-serif;">
                    PROYECTO
                  </td>
                  <td style="padding:12px 20px; border-bottom:1px solid #e2e8f0; color:#334155; font-size:14px; font-weight:bold; font-family: Arial, sans-serif;">
                    ${data.proyecto}
                  </td>
                </tr>

                <tr>
                  <td style="padding:12px 20px; border-bottom:1px solid #e2e8f0; color:#64748b; font-size:11px; font-weight:bold; text-transform:uppercase; font-family: Arial, sans-serif;">
                    SIGLA
                  </td>
                  <td style="padding:12px 20px; border-bottom:1px solid #e2e8f0; color:#4f46e5; font-size:14px; font-family:'Courier New', Courier, monospace; font-weight:bold;">
                    ${data.sigla}
                  </td>
                </tr>

                <tr>
                  <td style="padding:12px 20px; border-bottom:1px solid #e2e8f0; color:#64748b; font-size:11px; font-weight:bold; text-transform:uppercase; font-family: Arial, sans-serif;">
                    TÍTULO
                  </td>
                  <td style="padding:12px 20px; border-bottom:1px solid #e2e8f0; color:#334155; font-size:14px; font-family: Arial, sans-serif;">
                    ${data.titulo}
                  </td>
                </tr>

                <tr>
                  <td style="padding:12px 20px; border-bottom:1px solid #e2e8f0; color:#64748b; font-size:11px; font-weight:bold; text-transform:uppercase; font-family: Arial, sans-serif;">
                    EVENTO
                  </td>
                  <td style="padding:12px 20px; border-bottom:1px solid #e2e8f0; color:#334155; font-size:14px; font-family: Arial, sans-serif;">
                    ${eventDetail}
                  </td>
                </tr>

                <tr>
                  <td style="padding:12px 20px; color:#64748b; font-size:11px; font-weight:bold; text-transform:uppercase; font-family: Arial, sans-serif;">
                    PRIORIDAD
                  </td>
                  <td style="padding:12px 20px; color:${pColor}; font-weight:bold; font-size:14px; font-family: Arial, sans-serif;">
                    ● ${data.prioridad}
                  </td>
                </tr>

              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-top:35px;">
                    <a href="${link}" target="_blank"
                       style="background-color:#4f46e5; color:#ffffff; text-decoration:none; 
                              padding:14px 28px; display:inline-block; border-radius:6px;
                              font-weight:bold; font-size:14px; font-family: Arial, sans-serif;">
                      Ver en Plataforma
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td bgcolor="#f1f5f9" align="center" style="padding:20px; color:#94a3b8; font-size:11px; font-family: Arial, sans-serif;">
              Generado automáticamente por PrimeBug
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `;
};

module.exports = { getEmailTemplate };