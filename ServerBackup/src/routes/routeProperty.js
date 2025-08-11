const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController'); 
// CORREÇÃO: Importar o middleware de autenticação
const authMiddleware = require('../middlewares/auth');

// CORREÇÃO: Aplicar o middleware em todas as rotas que exigem um usuário logado
router.get('/properties', authMiddleware, propertyController.getAllProperties);
router.get('/propGetById/:nomepropriedade', authMiddleware, propertyController.getPropertyById);
router.post('/registerProp', authMiddleware, propertyController.createProperty);
router.put('/updateProp/:nomepropriedade', authMiddleware, propertyController.updateProperty);
router.delete('/propDelete/:nomepropriedade', authMiddleware, propertyController.deleteProperty);

module.exports = router;