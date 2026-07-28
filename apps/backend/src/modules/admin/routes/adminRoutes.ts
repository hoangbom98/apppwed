const { Router } = require('express');
const projectController = require('../controllers/system/projectController');
const moduleController = require('../controllers/system/moduleController');
const featureController = require('../controllers/system/featureController');
const contentController = require('../controllers/content/contentController');
const authenticate = require('../../../shared/middlewares/auth/auth');

// Role guard — super_admin only
function superAdminOnly(req, res, next) {
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'Super admin only' });
  }
  next();
}

// Role guard — admin or super_admin
function adminOrSuper(req, res, next) {
  if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'Admin or super admin only' });
  }
  next();
}

const router = Router();

// ===== PROJECTS =====
router.get('/projects', authenticate, superAdminOnly, projectController.list);
router.post('/projects', authenticate, superAdminOnly, projectController.create);
router.put('/projects/:id', authenticate, superAdminOnly, projectController.update);
router.patch('/projects/:id/toggle', authenticate, superAdminOnly, projectController.toggle);
router.delete('/projects/:id', authenticate, superAdminOnly, projectController.delete);

// ===== MODULES (cho từng project) =====
router.get('/projects/:projectKey/modules', authenticate, adminOrSuper, moduleController.list);
router.post('/projects/:projectKey/modules', authenticate, superAdminOnly, moduleController.create);
router.put('/modules/:moduleId', authenticate, adminOrSuper, moduleController.update);
router.patch('/modules/:moduleId/toggle', authenticate, adminOrSuper, moduleController.toggle);
router.delete('/modules/:moduleId', authenticate, superAdminOnly, moduleController.delete);

// ===== FEATURES (cho từng module) =====
router.get('/modules/:moduleId/features', authenticate, adminOrSuper, featureController.list);
router.post('/modules/:moduleId/features', authenticate, adminOrSuper, featureController.create);
router.put('/features/:featureId', authenticate, adminOrSuper, featureController.update);
router.patch('/features/:featureId/toggle', authenticate, adminOrSuper, featureController.toggle);
router.delete('/features/:featureId', authenticate, adminOrSuper, featureController.delete);

// ===== CONTENT =====
router.get('/projects/:projectKey/content', authenticate, adminOrSuper, contentController.list);
router.post('/projects/:projectKey/content', authenticate, adminOrSuper, contentController.create);
router.put('/content/:contentId', authenticate, adminOrSuper, contentController.update);
router.delete('/content/:contentId', authenticate, adminOrSuper, contentController.delete);

module.exports = router;
