const XLSX = require('xlsx');
const workbook = XLSX.readFile('prisma/자산정보1_업로드1.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const headers = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0];
console.log(headers);
