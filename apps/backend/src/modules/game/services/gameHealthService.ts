const { TCGamingService } = require('../../shared/services/aggregators');

async function checkTCG(): Promise<void> {
  console.log('Running TCGaming Health Check...');
  const config = {
    baseUrl:   process.env.TCGAMING_API_URL   || 'http://www.connect6play.com/doBusiness.do',
    apiKey:    process.env.TCGAMING_MERCHANT_CODE || 'ewiinvndk',
    secretKey: process.env.TCGAMING_DES_KEY   || 'u2nkrkQV',
    config: {
      hashKey:  process.env.TCGAMING_HASH_KEY  || 'ld1AN3saSuowR7wb',
      currency: process.env.TCGAMING_CURRENCY  || 'VNDK',
    },
  };

  const service = new TCGamingService(config);

  try {
    await service.getProductBalance('check_connection', '2');
    console.log('TCGaming API is reachable.');
    process.exit(0);
  } catch (err: unknown) {
    console.error('TCGaming API Check Failed:', err);
    process.exit(1);
  }
}

checkTCG();
