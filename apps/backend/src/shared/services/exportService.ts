/**
 * Export Service — generate CSV or JSON exports from Prisma queries
 */

/**
 * Convert an array of objects to CSV string
 * @param {object[]} rows
 * @param {string[]} columns - column names (keys)
 * @returns {string}
 */
exports.toCSV = (rows, columns) => {
  if (!rows || rows.length === 0) return '';
  const cols = columns || Object.keys(rows[0]);
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = cols.join(',');
  const body   = rows.map(r => cols.map(c => escape(r[c])).join(',')).join('\n');
  return `${header}\n${body}`;
};

/**
 * Send CSV download response
 * @param {object} res - Express response
 * @param {object[]} rows
 * @param {string} filename
 * @param {string[]} columns
 */
exports.sendCSV = (res, rows, filename, columns) => {
  const csv = exports.toCSV(rows, columns);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
  res.send('\uFEFF' + csv); // BOM for Excel UTF-8 compatibility
};

/**
 * Send JSON download response
 */
exports.sendJSON = (res, data, filename) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
  res.send(JSON.stringify(data, null, 2));
};

/**
 * Generic paginated export helper — fetches ALL records up to maxRows
 * @param {object} model - Prisma model
 * @param {object} where - Prisma where clause
 * @param {object[]} select - Prisma select fields
 * @param {number} maxRows
 */
exports.fetchAll = async (model, where = {}, orderBy = { createdAt: 'desc' }, maxRows = 10000) => {
  return model.findMany({ where, orderBy, take: maxRows });
};
