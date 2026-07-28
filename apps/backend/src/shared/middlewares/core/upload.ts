/**
 * Upload middleware — re-exports multer instance from uploadService
 * plus convenience single-field / multi-field helpers.
 *
 * Usage in routes:
 *   const upload = require('../../shared/middlewares/upload');
 *   router.post('/avatar', upload.single('avatar'), handler);
 *   router.post('/gallery', upload.array('images', 10), handler);
 *   router.post('/docs', upload.fields([{name:'front'},{name:'back'}]), handler);
 */
const { upload: multerInstance } = require('../../services/uploadService');
const { error: sendError } = require('../../utils/network/response');

/**
 * Wraps a multer handler and converts multer errors to JSON responses.
 * @param {Function} multerHandler  – e.g. multerInstance.single('file')
 */
function wrap(multerHandler) {
  return (req, res, next) => {
    multerHandler(req, res, (err) => {
      if (!err) return next();
      if (err.code === 'LIMIT_FILE_SIZE')
        return sendError(res, 'File too large (max 10 MB)', 413);
      if (err.message === 'File type not allowed')
        return sendError(res, 'File type not allowed (jpeg/png/webp/gif/mp4/webm)', 415);
      return sendError(res, err.message || 'Upload error', 400);
    });
  };
}

module.exports = {
  /** Accept a single file in field `fieldname` */
  single: (fieldname) => wrap(multerInstance.single(fieldname)),

  /** Accept up to `maxCount` files in field `fieldname` */
  array: (fieldname, maxCount = 10) => wrap(multerInstance.array(fieldname, maxCount)),

  /** Accept files across multiple named fields */
  fields: (fields) => wrap(multerInstance.fields(fields)),

  /** Accept any file(s), field name does not matter */
  any: () => wrap(multerInstance.any()),

  /** Raw multer instance (for custom usage) */
  raw: multerInstance,
};
