const prisma = require('../lib/prisma');

class ProductivityService {
  /**
   * Calcula a produtividade geral para uma propriedade específica.
   * @param {string} nomepropriedade - O nome da propriedade para calcular.
   * @returns {Promise<object>} - Um objeto contendo os detalhes da produtividade.
   * @throws {Error} - Lança um erro se a propriedade não for encontrada.
   */
  async calculateProductivityForProperty(nomepropriedade) {
    console.log(`[Service] Calculando produtividade para: ${nomepropriedade}`);

    // 1. Busca a propriedade e suas produções no banco de dados
    const propriedade = await prisma.propriedade.findUnique({
      where: { nomepropriedade },
      include: {
        producoes: {
          select: {
            quantidade: true,
            areaproducao: true,
          },
        },
      },
    });

    if (!propriedade) {
      console.warn(`[Service] Propriedade "${nomepropriedade}" não encontrada.`);
      // Lança um erro que será capturado pelo controller
      const error = new Error('Propriedade não encontrada.');
      error.statusCode = 404;
      throw error;
    }

    const areaTotalDaPropriedade = propriedade.area_ha;
    
    // Se não houver produções, retorna produtividade zero
    if (propriedade.producoes.length === 0) {
      return {
        message: 'A propriedade não possui registros de produção para calcular a produtividade.',
        nomepropriedade: propriedade.nomepropriedade,
        areaTotal: areaTotalDaPropriedade,
        totalProduzido: 0,
        produtividadeGeral: 0,
      };
    }

    // 2. Soma a quantidade total produzida
    const totalProduzido = propriedade.producoes.reduce(
      (acc, prod) => acc + (prod.quantidade || 0),
      0
    );

    // 3. Calcula a produtividade (quantidade / hectare total da propriedade)
    const produtividadeGeral = areaTotalDaPropriedade > 0 
      ? totalProduzido / areaTotalDaPropriedade 
      : 0;

    console.log(`[Service] Produtividade calculada com sucesso para "${nomepropriedade}"`);

    // 4. Retorna o objeto com o resultado calculado
    return {
      nomepropriedade: propriedade.nomepropriedade,
      areaTotal: areaTotalDaPropriedade,
      totalProduzido: totalProduzido,
      produtividadeGeral: parseFloat(produtividadeGeral.toFixed(2)),
    };
  }
}

module.exports = new ProductivityService();