import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const exportToExcel = async (data, filename = 'Reporte_PrimeBug') => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Bugs');

    // 1. Configuración de Columnas
    worksheet.columns = [
        { header: 'ID', key: 'id', width: 15 },
        { header: 'TÍTULO', key: 'title', width: 50 },
        { header: 'CATEGORÍA', key: 'category', width: 15 },
        { header: 'CREADO POR', key: 'creator', width: 20 },
        { header: 'F. CREACIÓN', key: 'date_created', width: 15 },
        { header: 'ASIGNADO A', key: 'assigned', width: 20 },
        { header: 'F. MODIF.', key: 'date_updated', width: 15 },
        { header: 'DÍAS', key: 'days', width: 10 },
        { header: 'CRITICIDAD', key: 'priority', width: 15 },
        { header: 'ESTADO', key: 'status', width: 15 },
    ];

    // 2. Estilo de la Cabecera Principal
    const headerRow = worksheet.getRow(1);
    headerRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 30;

    // 3. Procesamiento de Datos con Agrupación Visual
    let currentProject = null;

    data.forEach(bug => {
        // Si el proyecto cambia, insertamos una fila de encabezado de grupo
        if (bug.projectName !== currentProject) {
            currentProject = bug.projectName;
            
            const groupRow = worksheet.addRow({ id: `PROYECTO: ${currentProject.toUpperCase()}` });
            
            // Estilizar la fila de grupo
            groupRow.getCell(1).font = { bold: true, color: { argb: 'FF3730A3' }, size: 11 };
            groupRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } }; // Indigo claro
            
            // Combinar celdas para el título del proyecto
            worksheet.mergeCells(`A${groupRow.number}:J${groupRow.number}`);
        }

        // Insertar la fila del Bug
        const row = worksheet.addRow({
            id: bug.numero_bug || bug.id,
            title: bug.titulo,
            category: bug.categoria || 'General',
            creator: bug.creado_por_label,
            date_created: bug.createdAtDate ? bug.createdAtDate.toLocaleDateString() : '',
            assigned: bug.assigned_label || bug.asignado_label,
            date_updated: bug.updatedAtDate ? bug.updatedAtDate.toLocaleDateString() : '',
            days: bug.daysSinceUpdate,
            priority: bug.prioridad,
            status: bug.estado
        });

        // --- ESTILOS CONDICIONALES ---
        const statusCell = row.getCell('status');
        const statusColors = {
            'Abierto': 'FF2563EB',
            'En Progreso': 'FFD97706',
            'Re Abierta': 'FFDC2626',
            'Resuelto': 'FF10B981',
            'Cerrado': 'FF64748B'
        };
        if (statusColors[bug.estado]) {
            statusCell.font = { color: { argb: statusColors[bug.estado] }, bold: true };
        }

        const priorityCell = row.getCell('priority');
        if (bug.prioridad === 'Crítica') {
            priorityCell.font = { color: { argb: 'FFDC2626' }, bold: true };
            priorityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        }
    });

    // 4. Bordes y Alineación General
    worksheet.eachRow((row) => {
        row.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
            };
            cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        });
    });

    // 5. Descarga
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};