export const formatDateDDMMYYYY = (dateStr: string): string => {
  if (!dateStr) return '';
  // Check if already in DD/MM/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  
  // Check if already in DD-MM-YYYY format
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    return dateStr.replace(/-/g, '/');
  }
  
  // Parse YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};
