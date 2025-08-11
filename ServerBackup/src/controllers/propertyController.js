const prisma = require('../lib/prisma');
const { PrismaClient } = require('@prisma/client');

module.exports = {
  // # getAllProperties
  async getAllProperties(req, res) {
    const authenticatedUserId = req.userId;
    console.log(`➡️ Requisição recebida para listar todas as propriedades do usuário: ${authenticatedUserId}`);
    try {
      const properties = await prisma.propriedade.findMany({
        where: { usuarioId: authenticatedUserId }, // FILTRA Pelo usuário logado
        include: {
          usuario: true,
          producoes: {
            select: {
              cultura: true,
              data: true
            },
            orderBy: {
              data: 'desc'
            }
          }
        },
      });

      const propertiesWithAllCultures = properties.map(property => {
        const culturas = property.producoes.map(prod => prod.cultura); 
        const { producoes, ...rest } = property; 
        return { ...rest, culturas }; 
      });

      console.log('✅ Propriedades listadas com sucesso:', propertiesWithAllCultures.length);
      res.status(200).json(propertiesWithAllCultures);
    } catch (error) {
      console.error('❌ Erro ao listar propriedades:', error);
      res.status(500).json({ error: 'Ops! Ocorreu um erro ao buscar as propriedades.' });
    }
  },

  // # getPropertyById
  async getPropertyById(req, res) {
    const { nomepropriedade } = req.params;
    const authenticatedUserId = req.userId;
    console.log(`➡️ Requisição recebida para buscar propriedade: "${nomepropriedade}"`);
    try {
      const property = await prisma.propriedade.findFirst({
        where: {
          nomepropriedade: nomepropriedade,
          usuarioId: authenticatedUserId, // GARANTE que a propriedade é do usuário
        },
        include: {
          usuario: true,
          producoes: {
            select: { cultura: true, data: true },
            orderBy: { data: 'desc' }
          }
        },
      });

      if (!property) {
        console.warn(`⚠️ Propriedade "${nomepropriedade}" não encontrada ou não pertence ao usuário.`);
        return res.status(404).json({ error: `Propriedade "${nomepropriedade}" não encontrada.` });
      }

      const culturas = property.producoes.map(prod => prod.cultura); 
      const { producoes, ...rest } = property; 

      console.log('✅ Propriedade encontrada com sucesso:', property.nomepropriedade);
      res.status(200).json({ ...rest, culturas }); 
    } catch (error) {
      console.error('❌ Erro ao buscar propriedade:', error);
      res.status(500).json({ error: 'Ops! Ocorreu um erro ao buscar esta propriedade.' });
    }
  },

  // # createProperty
  async createProperty(req, res) {
    const { nomepropriedade, area_ha, localizacao } = req.body;
    const authenticatedUserId = req.userId; // PEGA O ID DO USUÁRIO LOGADO
    console.log('➡️ Requisição recebida para criar uma nova propriedade');
    console.log('📦 Dados recebidos:', req.body);

    if (!nomepropriedade || area_ha === undefined || !localizacao) {
      console.warn('⚠️ Campos obrigatórios para criar propriedade ausentes.');
      return res.status(400).json({ error: 'Por favor, preencha todos os campos obrigatórios: nome da propriedade, área em hectares e localização.' });
    }

    try {
      const existingProperty = await prisma.propriedade.findUnique({ where: { nomepropriedade } });
      if (existingProperty) {
        console.warn(`⚠️ Já existe uma propriedade com o nome "${nomepropriedade}".`);
        return res.status(400).json({ error: `Já existe uma propriedade com o nome "${nomepropriedade}". Escolha outro nome.` });
      }

      const newProperty = await prisma.propriedade.create({
        data: {
          nomepropriedade,
          area_ha,
          localizacao,
          usuario: {
            connect: { id: authenticatedUserId }, // CONECTA COM O USUÁRIO LOGADO
          },
        },
        include: {
          usuario: true,
          producoes: {
            select: { cultura: true, data: true },
            orderBy: { data: 'desc' }
          }
        },
      });

      const culturas = newProperty.producoes.map(prod => prod.cultura); 
      const { producoes, ...rest } = newProperty;

      console.log('✅ Propriedade criada com sucesso:', newProperty.nomepropriedade);
      res.status(201).json({
        message: 'Propriedade cadastrada com sucesso!',
        property: { ...rest, culturas } 
      });
    } catch (error) {
      console.error('❌ Erro ao criar propriedade:', error);
      if (error.code === 'P2025' && error.meta?.cause?.includes('No \'usuario\' record(s)')) {
          console.warn(`⚠️ Usuário autenticado com ID "${authenticatedUserId}" não encontrado no banco.`);
          return res.status(400).json({ error: `O usuário autenticado não foi encontrado.` });
      }
      res.status(500).json({ error: 'Ops! Não foi possível cadastrar a propriedade. Tente novamente mais tarde.' });
    }
  },

  // # updateProperty
  async updateProperty(req, res) {
    const { nomepropriedade } = req.params;
    const { area_ha, localizacao } = req.body;
    const authenticatedUserId = req.userId;
    console.log(`➡️ Requisição recebida para atualizar propriedade: "${nomepropriedade}"`);
    console.log('📦 Dados de atualização:', req.body);

    try {
      // Verifica se a propriedade existe e pertence ao usuário antes de deletar produções e finanças associadas
      const property = await prisma.propriedade.findFirst({
        where: {
          nomepropriedade,
          usuarioId: authenticatedUserId
        }
      });
      
      if (!property) {
        console.warn(`⚠️ Propriedade "${nomepropriedade}" não encontrada ou não pertence ao usuário para atualização.`);
        return res.status(404).json({ error: `Não foi possível encontrar a propriedade "${nomepropriedade}" para atualizar.` });
      }

      const updatedProperty = await prisma.propriedade.update({
        where: {
          nomepropriedade: nomepropriedade,
        },
        data: {
          area_ha,
          localizacao,
        },
        include: {
          usuario: true,
          producoes: {
            select: { cultura: true, data: true },
            orderBy: { data: 'desc' }
          }
        },
      });

      const culturas = updatedProperty.producoes.map(prod => prod.cultura); 
      const { producoes, ...rest } = updatedProperty;

      console.log('🔄 Propriedade atualizada com sucesso:', updatedProperty.nomepropriedade);
      res.status(200).json({
        message: 'Propriedade atualizada com sucesso!',
        property: { ...rest, culturas } 
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar propriedade:', error);
      if (error.code === 'P2025') {
          console.warn(`⚠️ Propriedade "${nomepropriedade}" não encontrada para atualização.`);
          return res.status(404).json({ error: `Não foi possível encontrar a propriedade "${nomepropriedade}" para atualizar.` });
      }
      res.status(500).json({ error: 'Ops! Ocorreu um erro ao atualizar a propriedade. Tente novamente.' });
    }
  },

  // # deleteProperty
  async deleteProperty(req, res) {
    const { nomepropriedade } = req.params;
    const authenticatedUserId = req.userId;
    console.log(`➡️ Requisição recebida para deletar propriedade: "${nomepropriedade}"`);
    try {
      // VERIFICA se a propriedade existe e pertence ao usuário antes de deletar
      const property = await prisma.propriedade.findFirst({
        where: {
          nomepropriedade,
          usuarioId: authenticatedUserId
        }
      });
      
      if (!property) {
        console.warn(`⚠️ Propriedade "${nomepropriedade}" não encontrada ou não pertence ao usuário para deleção.`);
        return res.status(404).json({ error: `Não foi possível encontrar a propriedade "${nomepropriedade}" para deletar.` });
      }

      // Deleta em cascata (manualmente, pois o Prisma com SQLite não suporta bem)
      await prisma.financeiro.deleteMany({
        where: { nomepropriedade: nomepropriedade },
      });
      await prisma.producao.deleteMany({
        where: { nomepropriedade: nomepropriedade },
      });
      await prisma.propriedade.delete({
        where: { nomepropriedade: nomepropriedade },
      });

      console.log('🗑️ Propriedade e dados associados deletados com sucesso:', nomepropriedade);
      res.status(204).send();
    } catch (error) {
      console.error('❌ Erro ao deletar propriedade:', error);
      if (error.code === 'P2025') {
        console.warn(`⚠️ Propriedade "${nomepropriedade}" não foi encontrada durante a operação.`);
        return res.status(404).json({ error: `Não foi possível encontrar a propriedade "${nomepropriedade}" para deletar.` });
      }
      res.status(500).json({ error: 'Ops! Ocorreu um erro ao deletar a propriedade.' });
    }
  },
};