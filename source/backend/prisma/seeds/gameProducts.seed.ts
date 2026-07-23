'use strict';
/**
 * prisma/seeds/gameProducts.seed.js — game_db GameProduct catalog
 * Populates GameAggregator + GameProduct rows for GSC, Goldgate, TC Gaming.
 * Run: npm run seed:game-products
 */

const { getPrismaClient } = require('../../src/config/databases');

// ─── Product catalogs ────────────────────────────────────────────────────────

const GSC_PRODUCTS = [
  ['1002','EVO','Evolution Gaming (ASIA)',['live'],'seamless'],
  ['1004','BIGG','BigGaming',['live'],'seamless'],
  ['1006','PP','Pragmatic Play',['rng','live'],'seamless'],
  ['1007','PG','PG Soft',['rng'],'seamless'],
  ['1009','CQ9','CQ9 Gaming',['rng','fish'],'seamless'],
  ['1011','PT','Play Tech',['rng','live'],'seamless'],
  ['1012','SBO','SBO Sports',['sports'],'seamless'],
  ['1016','YB','YeeBet',['live'],'seamless'],
  ['1018','L22','Live22',['rng'],'seamless'],
  ['1020','WM','WM Casino',['live'],'seamless'],
  ['1022','SEX','Sexy Gaming',['live'],'seamless'],
  ['1033','SV388','SV388 Cockfighting',['sports'],'seamless'],
  ['1038','K855','King855/CT855',['live'],'seamless'],
  ['1040','WBET','WBET',['sports'],'seamless'],
  ['1046','SABA','IBC-SABA Sports',['sports'],'seamless'],
  ['1049','EVO2','Evoplay',['rng','live'],'seamless'],
  ['1050','PS','PlayStar',['rng'],'seamless'],
  ['1052','DG','DreamGaming',['live'],'seamless'],
  ['1079','FC','Fachai Gaming',['rng','fish'],'seamless'],
  ['1085','JDB','JDB',['rng','fish','pvp'],'seamless'],
  ['1091','JILI','JILI TCG',['rng','fish','pvp'],'seamless'],
  ['1097','FUNTA','FuntaGaming',['rng'],'seamless'],
  ['1102','KA','KA Gaming',['rng'],'seamless'],
  ['1115','BOOM','Booming Games',['rng'],'seamless'],
  ['1138','SPB','Spribe',['rng'],'seamless'],
  ['1139','FS','Fastspin',['rng'],'seamless'],
  ['1148','WOW','WOW Gaming',['rng','pvp'],'seamless'],
  ['1149','AI','AI Live Casino',['live'],'seamless'],
  ['1152','1XBET','1XBET',['sports','esports'],'seamless'],
  ['1153','HS','Hacksaw Gaming',['rng'],'seamless'],
  ['1154','BP','Bigpot',['rng'],'seamless'],
  ['1161','TADA','TADA Gaming',['rng'],'seamless'],
  ['1163','NOV','Novomatic',['rng'],'seamless'],
  ['1165','AVT','Aviatrix',['rng'],'seamless'],
  ['1166','NLC','No Limit City (ASIA)',['rng'],'seamless'],
  ['1167','BTG','Big Time Gaming (ASIA)',['rng'],'seamless'],
  ['1168','NE','Netent (ASIA)',['rng'],'seamless'],
  ['1169','RT','Red Tiger (ASIA)',['rng'],'seamless'],
  ['1183','FB','FB Sport',['sports'],'seamless'],
  ['1184','RICH','RICH88',['rng'],'seamless'],
  ['1185','SA','SA Gaming',['live'],'seamless'],
  ['1186','ENDO','Endorphina',['rng'],'seamless'],
  ['1194','PRETTY','Pretty Gaming',['live'],'seamless'],
  ['1197','HB','Habanero',['rng'],'seamless'],
  ['1203','PAG','PlayAce',['live','rng','fish'],'seamless'],
  ['1221','SG','Spade Gaming',['rng','fish'],'seamless'],
  ['1225','JKR','Joker',['rng','fish'],'seamless'],
  ['1232','QQKENO','QQ Keno',['lottery'],'seamless'],
  ['1241','TCGL','TCG LOTTO',['lottery'],'seamless'],
  ['1251','MG','Micro Gaming',['live','rng','fish'],'seamless'],
  ['1252','QT','Q Tech',['rng'],'seamless'],
  ['1254','AVI','Aviator',['rng'],'seamless'],
  ['1260','BGAM','BGaming',['rng'],'seamless'],
];

const TC_PRODUCTS = [
  ['2','TCGL','TCG LOTTO',['lottery'],'both'],
  ['3','PT','Playtech',['live','rng'],'transfer'],
  ['4','AG','PlayAce',['live','rng'],'both'],
  ['9','TTG','Toptrend Gaming',['rng'],'seamless'],
  ['12','PNG','Play n Go',['rng'],'transfer'],
  ['13','HB','Habanero',['rng'],'both'],
  ['16','CQ9','CQ9 Gaming',['rng','fish'],'both'],
  ['27','DG','DreamGaming',['live'],'both'],
  ['28','AB','AllBet',['live'],'transfer'],
  ['37','WD','Wazdan',['rng'],'seamless'],
  ['39','PP','Pragmatic Play',['live','rng'],'transfer'],
  ['41','BG','BigGame',['live'],'both'],
  ['43','MG','Micro Gaming',['live','rng','fish'],'transfer'],
  ['47','BTI','BTI Sports',['sports'],'both'],
  ['48','NE','NetEnt',['rng'],'transfer'],
  ['54','SBO','SBOBET Sports',['live','sports'],'transfer'],
  ['55','JDB','JDB',['rng','fish','pvp'],'both'],
  ['61','IMES','IM Esports',['esports'],'both'],
  ['64','LB','LB-KENO',['lottery'],'both'],
  ['65','CR','Crown Sports',['sports'],'transfer'],
  ['68','IMSB','IMSB Sports',['sports'],'both'],
  ['79','BB','BBIN',['live','rng','fish','sports'],'transfer'],
  ['90','BOM','Booming Games',['rng'],'seamless'],
  ['93','SA','SA Gaming',['live'],'both'],
  ['98','PG','Pocket Games Soft',['rng'],'both'],
  ['99','TF','TF Gaming',['esports'],'both'],
  ['104','CMD','CMD368 Sports',['sports'],'transfer'],
  ['112','SEX','Sexy AWC',['live'],'both'],
  ['118','WM','WM Casino',['live'],'both'],
  ['119','AMB','Ambpoker',['rng','pvp'],'seamless'],
  ['121','KM','King Midas',['rng','pvp'],'both'],
  ['130','BOS','Bos Blockchain',['live'],'both'],
  ['131','OBSB','Panda Sports',['sports'],'both'],
  ['140','JL','JILI',['rng','fish','pvp'],'transfer'],
  ['141','FC','Fachai Gaming',['rng','fish'],'transfer'],
  ['144','SG','Spade Gaming',['rng','fish'],'transfer'],
  ['145','AMBS','AMB Slot',['rng','fish'],'transfer'],
  ['148','RCB','RCB988 Sports',['sports'],'transfer'],
  ['151','UG2','United Gaming Sports',['sports'],'transfer'],
  ['157','KA','KA Gaming',['rng','fish'],'transfer'],
  ['161','BNG','Booongo',['rng'],'transfer'],
  ['162','R88','Rich88',['rng','pvp'],'transfer'],
  ['167','POLY','Poly Sports',['sports'],'transfer'],
  ['172','EG4','Evolution Casino',['live'],'transfer'],
  ['174','SB','Saba Sports',['sports'],'transfer'],
  ['177','EZ','Ezugi',['live'],'transfer'],
  ['182','DRS','Dragoon Soft',['rng','fish'],'transfer'],
  ['184','BTG','Big Time Gaming',['rng'],'transfer'],
  ['185','NLC','No Limit City',['rng'],'transfer'],
  ['186','RT','Red Tiger',['rng'],'transfer'],
  ['193','SPB','Spribe',['rng'],'seamless'],
  ['194','PGE','PG Soft (E)',['rng'],'transfer'],
  ['200','GM','Gemini',['rng'],'transfer'],
  ['206','EKOR','EKOR Lottery',['lottery'],'transfer'],
  ['215','YGD','Yggdrasil',['rng'],'transfer'],
  ['216','FS','Fastspin',['rng','fish'],'transfer'],
  ['218','WOW','WOW Gaming',['rng','pvp'],'transfer'],
  ['276','AVT','Aviator',['rng'],'seamless'],
  ['384','TCG_SEA','TCG SEA LOTTO',['lottery'],'both'],
  ['420','TCG_VN','TCG LOTTO VN',['lottery'],'both'],
  ['460','TCG_LIVE','TCG Live',['lottery'],'both'],
];

const GOLDGATE_PRODUCTS = [
  ['casino-evolution','EVO','Evolution Gaming',['live'],'seamless'],
  ['pg-soft','PG','PG Soft',['rng'],'seamless'],
  ['jdb','JDB','JDB',['rng','fish'],'seamless'],
  ['jili','JILI','JILI Gaming',['rng','fish','pvp'],'seamless'],
  ['cq9','CQ9','CQ9 Gaming',['rng','fish'],'seamless'],
  ['pragmatic-play','PP','Pragmatic Play',['rng','live'],'seamless'],
  ['pragmatic-live','PPLV','Pragmatic Play Live',['live'],'seamless'],
  ['sbo','SBO','SBO Sports',['sports'],'seamless'],
  ['fa-chai','FC','Fachai Gaming',['rng','fish'],'seamless'],
  ['spade-gaming','SG','Spade Gaming',['rng','fish'],'seamless'],
  ['play-n-go','PNG','Play n Go',['rng'],'seamless'],
  ['no-limit-city','NLC','No Limit City',['rng'],'seamless'],
  ['hacksaw-gaming','HS','Hacksaw Gaming',['rng'],'seamless'],
  ['big-time-gaming','BTG','Big Time Gaming',['rng'],'seamless'],
  ['relax-gaming','RLX','Relax Gaming',['rng'],'seamless'],
  ['yggdrasil','YGD','Yggdrasil',['rng'],'seamless'],
  ['habanero','HB','Habanero',['rng'],'seamless'],
  ['red-tiger','RT','Red Tiger',['rng'],'seamless'],
  ['netent','NE','NetEnt',['rng'],'seamless'],
  ['booming-games','BOOM','Booming Games',['rng'],'seamless'],
  ['live22','L22','Live22',['rng'],'seamless'],
  ['evoplay','EVO2','Evoplay',['rng','live'],'seamless'],
  ['spribe','SPB','Spribe',['rng'],'seamless'],
  ['avatar-ux','AUX','Avatar UX',['rng'],'seamless'],
  ['endorphina','END','Endorphina',['rng'],'seamless'],
  ['booongo','BOO','Booongo',['rng'],'seamless'],
];

async function seed() {
  const prisma = getPrismaClient('game');

  // Upsert aggregators first
  const gscAgg = await prisma.gameAggregator.upsert({
    where:  { code: 'GSC' },
    update: { status: 'active' },
    create: { code: 'GSC', name: 'GSC Plus', description: 'GSC Plus API — 150+ game vendors', baseUrl: process.env.GSC_BASE_URL || 'https://api.gscplus.com', apiKey: process.env.GSC_API_KEY || '', secretKey: process.env.GSC_SECRET_KEY || '', status: 'active', config: { currency: 'VND', language: 'vi' }, sortOrder: 1 },
  });

  const ggAgg = await prisma.gameAggregator.upsert({
    where:  { code: 'GOLDGATE' },
    update: { status: 'active' },
    create: { code: 'GOLDGATE', name: 'Goldgate', description: 'Goldgate API — seamless wallet, 100+ vendors', baseUrl: process.env.GOLDGATE_BASE_URL || 'https://api.goldgate.io', apiKey: process.env.GOLDGATE_CLIENT_ID || '', secretKey: process.env.GOLDGATE_CLIENT_SECRET || '', status: 'active', config: { language: 'vi' }, sortOrder: 2 },
  });

  const tcAgg = await prisma.gameAggregator.upsert({
    where:  { code: 'TCGAMING' },
    update: { status: 'active' },
    create: { code: 'TCGAMING', name: 'TC Gaming', description: 'TC Gaming — DES+SHA256, transfer+seamless, 200+ products', baseUrl: process.env.TCGAMING_API_URL || 'https://api.tcgaming.com', apiKey: process.env.TCGAMING_MERCHANT_CODE || '', secretKey: process.env.TCGAMING_DES_KEY || '', status: 'active', config: { hashKey: process.env.TCGAMING_HASH_KEY || '', currency: 'VND2' }, sortOrder: 3 },
  });

  let total = 0;

  for (const [productCode, abbrev, name, gameTypes, walletType] of GSC_PRODUCTS) {
    await prisma.gameProduct.upsert({
      where:  { aggregatorId_productCode: { aggregatorId: gscAgg.id, productCode } },
      update: { name, abbrev, gameTypes, walletType, status: 'active' },
      create: { aggregatorId: gscAgg.id, productCode, abbrev, name, gameTypes, walletType, status: 'active' },
    });
    total++;
  }
  console.log(`  GSC: ${GSC_PRODUCTS.length} products`);

  for (const [productCode, abbrev, name, gameTypes, walletType] of TC_PRODUCTS) {
    const wt = walletType === 'both' ? 'transfer' : walletType;
    await prisma.gameProduct.upsert({
      where:  { aggregatorId_productCode: { aggregatorId: tcAgg.id, productCode } },
      update: { name, abbrev, gameTypes, walletType: wt, status: 'active' },
      create: { aggregatorId: tcAgg.id, productCode, abbrev, name, gameTypes, walletType: wt, status: 'active', config: { supportsBoth: walletType === 'both' } },
    });
    total++;
  }
  console.log(`  TCGaming: ${TC_PRODUCTS.length} products`);

  for (const [vendorCode, abbrev, name, gameTypes, walletType] of GOLDGATE_PRODUCTS) {
    await prisma.gameProduct.upsert({
      where:  { aggregatorId_productCode: { aggregatorId: ggAgg.id, productCode: vendorCode } },
      update: { name, abbrev, gameTypes, walletType, status: 'active' },
      create: { aggregatorId: ggAgg.id, productCode: vendorCode, abbrev, name, gameTypes, walletType, status: 'active' },
    });
    total++;
  }
  console.log(`  Goldgate: ${GOLDGATE_PRODUCTS.length} products`);
  console.log(`  Total: ${total} game products across 3 aggregators`);
}

module.exports = { seed };

if (require.main === module) {
  seed()
    .catch(e => { console.error('[seed:game-products] ❌', e); process.exit(1); })
    .then(() => getPrismaClient('game').$disconnect());
}
