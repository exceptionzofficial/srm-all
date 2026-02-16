
const XLSX = require('xlsx');

try {
    const workbook = XLSX.readFile('../Sweet department - nov 2025.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Get headers (first row is usually headers, but looking at previous output, it might be row 1 or 2)
    // Let's print first 3 rows to identify headers clearly.
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log('--- EXCEL DUMP ---');
    data.slice(0, 3).forEach((row, i) => {
        console.log(`Row ${i}:`, JSON.stringify(row));
    });
} catch (error) {
    console.error('Error:', error);
}
