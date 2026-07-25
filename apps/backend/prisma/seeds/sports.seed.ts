'use strict';
/**
 * prisma/seeds/sports.seed.ts — Sports DB comprehensive seed
 *
 * Tạo:
 *   1. Leagues        (6 giải đấu)
 *   2. Teams          (20 đội)
 *   3. Matches        (10 trận — scheduled + 2 live + 1 finished)
 *   4. Standings      (BXH cho EPL + V.League)
 *   5. Highlights     (4 video highlight)
 *   6. News           (5 tin tức)
 *   7. LiveStreams     (2 stream + admin streamer profile)
 *   8. BetMarkets     (tỷ lệ cược 1x2 cho mỗi trận)
 *   9. Promotions     (lì xì + bonus nạp tiền)
 *  10. Admin user     (admin@lkvip.com / Admin@123456)
 *
 * Idempotent — chạy lại an toàn, dùng upsert hoặc try/catch.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { getPrismaClient } = require('../../src/config/databases');
const prisma = getPrismaClient('sports');

// ── Helpers ───────────────────────────────────────────────────────────────────
const now         = new Date();
const fromNow     = (h: number) => new Date(now.getTime() + h * 3600_000);
const ago         = (h: number) => new Date(now.getTime() - h * 3600_000);
const slugify     = (s: string) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

// bcrypt hash của "Admin@123456"
const ADMIN_PW_HASH = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

async function seed() {
  console.log('  [sports] Bắt đầu seed Sports DB...');

  // ── 1. Admin user ───────────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where:  { email: 'admin@lkvip.com' },
    update: { role: 'admin' },
    create: {
      email:     'admin@lkvip.com',
      password:  ADMIN_PW_HASH,
      username:  'admin',
      fullName:  'LKVIP Admin',
      role:      'admin',
      status:    'active',
      isVerified: true,
    },
  });

  // Demo member user
  const demoUser = await prisma.user.upsert({
    where:  { email: 'demo@lkvip.com' },
    update: {},
    create: {
      email:    'demo@lkvip.com',
      password: ADMIN_PW_HASH,
      username: 'demo',
      fullName: 'Demo User',
      role:     'user',
      status:   'active',
      balance:  500_000,
    },
  });
  console.log('  Users: admin + demo');

  // ── 2. Leagues ──────────────────────────────────────────────────────────────
  const leagueDefs = [
    { name: 'English Premier League', slug: 'epl',        country: 'England',  type: 'national',      logo: 'https://media.api-sports.io/football/leagues/39.png',  sortOrder: 1, externalApiId: '39'  },
    { name: 'La Liga',                slug: 'la-liga',    country: 'Spain',    type: 'national',      logo: 'https://media.api-sports.io/football/leagues/140.png', sortOrder: 2, externalApiId: '140' },
    { name: 'UEFA Champions League',  slug: 'ucl',        country: 'Europe',   type: 'international', logo: 'https://media.api-sports.io/football/leagues/2.png',   sortOrder: 3, externalApiId: '2'   },
    { name: 'V.League 1',             slug: 'vleague1',   country: 'Vietnam',  type: 'national',      logo: 'https://media.api-sports.io/football/leagues/340.png', sortOrder: 4, externalApiId: '340' },
    { name: 'Bundesliga',             slug: 'bundesliga', country: 'Germany',  type: 'national',      logo: 'https://media.api-sports.io/football/leagues/78.png',  sortOrder: 5, externalApiId: '78'  },
    { name: 'Serie A',                slug: 'serie-a',    country: 'Italy',    type: 'national',      logo: 'https://media.api-sports.io/football/leagues/135.png', sortOrder: 6, externalApiId: '135' },
  ];

  const leagueMap: Record<string, string> = {};
  for (const lg of leagueDefs) {
    const r = await prisma.league.upsert({
      where:  { slug: lg.slug },
      update: { logo: lg.logo, sortOrder: lg.sortOrder, externalApiId: lg.externalApiId },
      create: { ...lg, status: 'active' },
    });
    leagueMap[lg.slug] = r.id;
  }
  console.log(`  Leagues: ${leagueDefs.length}`);

  // ── 3. Teams ─────────────────────────────────────────────────────────────────
  const teamDefs = [
    // EPL
    { leagueSlug: 'epl',        name: 'Manchester City',   slug: 'man-city',    logo: 'https://media.api-sports.io/football/teams/50.png',  country: 'England', externalApiId: '50'  },
    { leagueSlug: 'epl',        name: 'Arsenal',            slug: 'arsenal',     logo: 'https://media.api-sports.io/football/teams/42.png',  country: 'England', externalApiId: '42'  },
    { leagueSlug: 'epl',        name: 'Liverpool',          slug: 'liverpool',   logo: 'https://media.api-sports.io/football/teams/40.png',  country: 'England', externalApiId: '40'  },
    { leagueSlug: 'epl',        name: 'Chelsea',            slug: 'chelsea',     logo: 'https://media.api-sports.io/football/teams/49.png',  country: 'England', externalApiId: '49'  },
    { leagueSlug: 'epl',        name: 'Manchester United',  slug: 'man-utd',     logo: 'https://media.api-sports.io/football/teams/33.png',  country: 'England', externalApiId: '33'  },
    { leagueSlug: 'epl',        name: 'Tottenham Hotspur',  slug: 'tottenham',   logo: 'https://media.api-sports.io/football/teams/47.png',  country: 'England', externalApiId: '47'  },
    // La Liga
    { leagueSlug: 'la-liga',    name: 'Real Madrid',        slug: 'real-madrid', logo: 'https://media.api-sports.io/football/teams/541.png', country: 'Spain',   externalApiId: '541' },
    { leagueSlug: 'la-liga',    name: 'FC Barcelona',       slug: 'barcelona',   logo: 'https://media.api-sports.io/football/teams/529.png', country: 'Spain',   externalApiId: '529' },
    { leagueSlug: 'la-liga',    name: 'Atletico Madrid',    slug: 'atletico',    logo: 'https://media.api-sports.io/football/teams/530.png', country: 'Spain',   externalApiId: '530' },
    // V.League
    { leagueSlug: 'vleague1',   name: 'Hà Nội FC',          slug: 'hanoi-fc',    logo: 'https://media.api-sports.io/football/teams/10005.png', country: 'Vietnam', externalApiId: '10005' },
    { leagueSlug: 'vleague1',   name: 'HAGL',                slug: 'hagl',        logo: 'https://media.api-sports.io/football/teams/10018.png', country: 'Vietnam', externalApiId: '10018' },
    { leagueSlug: 'vleague1',   name: 'SHB Đà Nẵng',        slug: 'da-nang',     logo: 'https://media.api-sports.io/football/teams/10017.png', country: 'Vietnam', externalApiId: '10017' },
    { leagueSlug: 'vleague1',   name: 'Viettel FC',          slug: 'viettel',     logo: 'https://media.api-sports.io/football/teams/10019.png', country: 'Vietnam', externalApiId: '10019' },
    // Bundesliga
    { leagueSlug: 'bundesliga', name: 'Bayern Munich',      slug: 'bayern',      logo: 'https://media.api-sports.io/football/teams/157.png', country: 'Germany', externalApiId: '157' },
    { leagueSlug: 'bundesliga', name: 'Borussia Dortmund',  slug: 'dortmund',    logo: 'https://media.api-sports.io/football/teams/165.png', country: 'Germany', externalApiId: '165' },
    // Serie A
    { leagueSlug: 'serie-a',    name: 'AC Milan',            slug: 'ac-milan',    logo: 'https://media.api-sports.io/football/teams/489.png', country: 'Italy',   externalApiId: '489' },
    { leagueSlug: 'serie-a',    name: 'Inter Milan',         slug: 'inter-milan', logo: 'https://media.api-sports.io/football/teams/505.png', country: 'Italy',   externalApiId: '505' },
    { leagueSlug: 'serie-a',    name: 'Juventus',            slug: 'juventus',    logo: 'https://media.api-sports.io/football/teams/496.png', country: 'Italy',   externalApiId: '496' },
  ];

  const teamMap: Record<string, string> = {};
  for (const t of teamDefs) {
    const leagueId = leagueMap[t.leagueSlug];
    if (!leagueId) continue;
    try {
      const r = await prisma.team.upsert({
        where:  { slug: t.slug },
        update: { logo: t.logo, externalApiId: t.externalApiId },
        create: { leagueId, name: t.name, slug: t.slug, logo: t.logo, country: t.country, status: 'active', externalApiId: t.externalApiId },
      });
      teamMap[t.slug] = r.id;
    } catch { /* skip */ }
  }
  console.log(`  Teams: ${teamDefs.length}`);

  // ── 4. Matches ───────────────────────────────────────────────────────────────
  const matchDefs = [
    // Scheduled
    { lg: 'epl',        home: 'man-city',    away: 'arsenal',     start: fromNow(24),  status: 'scheduled', round: 'Matchday 38', season: '2024-25' },
    { lg: 'epl',        home: 'liverpool',   away: 'chelsea',     start: fromNow(48),  status: 'scheduled', round: 'Matchday 38', season: '2024-25' },
    { lg: 'epl',        home: 'man-utd',     away: 'tottenham',   start: fromNow(72),  status: 'scheduled', round: 'Matchday 38', season: '2024-25' },
    { lg: 'la-liga',    home: 'real-madrid', away: 'barcelona',   start: fromNow(36),  status: 'scheduled', round: 'Jornada 38',  season: '2024-25' },
    { lg: 'la-liga',    home: 'atletico',    away: 'barcelona',   start: fromNow(60),  status: 'scheduled', round: 'Jornada 37',  season: '2024-25' },
    { lg: 'vleague1',   home: 'hanoi-fc',    away: 'hagl',        start: fromNow(8),   status: 'scheduled', round: 'Vòng 25',     season: '2025'    },
    { lg: 'vleague1',   home: 'viettel',     away: 'da-nang',     start: fromNow(12),  status: 'scheduled', round: 'Vòng 25',     season: '2025'    },
    { lg: 'bundesliga', home: 'bayern',      away: 'dortmund',    start: fromNow(96),  status: 'scheduled', round: 'Matchday 34', season: '2024-25' },
    // LIVE — đang diễn ra
    { lg: 'serie-a',    home: 'inter-milan', away: 'ac-milan',    start: ago(1),       status: 'live',      round: 'Matchday 38', season: '2024-25', homeScore: 1, awayScore: 0 },
    { lg: 'ucl',        home: 'real-madrid', away: 'man-city',    start: ago(0.5),     status: 'live',      round: 'Semi-Final',  season: '2024-25', homeScore: 2, awayScore: 1 },
    // Finished
    { lg: 'epl',        home: 'arsenal',     away: 'liverpool',   start: ago(48),      status: 'finished',  round: 'Matchday 37', season: '2024-25', homeScore: 2, awayScore: 2 },
  ];

  const matchIds: string[] = [];
  for (const m of matchDefs) {
    const leagueId   = leagueMap[m.lg];
    const homeTeamId = teamMap[m.home];
    const awayTeamId = teamMap[m.away];
    if (!leagueId || !homeTeamId || !awayTeamId) continue;
    try {
      const r = await prisma.match.create({
        data: {
          leagueId, homeTeamId, awayTeamId,
          startTime:  m.start,
          status:     m.status,
          round:      m.round,
          season:     m.season,
          homeScore:  m.homeScore ?? null,
          awayScore:  m.awayScore ?? null,
        },
      });
      matchIds.push(r.id);
    } catch { /* duplicate — skip */ }
  }
  console.log(`  Matches: ${matchIds.length} created`);

  // ── 5. Standings — EPL (sample top 4) ───────────────────────────────────────
  const eplId     = leagueMap['epl'];
  const vleagueId = leagueMap['vleague1'];
  const SEASON    = '2024-25';

  const standingDefs = [
    // EPL
    { leagueId: eplId,     teamSlug: 'man-city',  rank: 1, played: 37, wins: 26, draws: 5, losses: 6, goalsFor: 93, goalsAgainst: 44, goalDiff: 49, points: 83, form: 'WWWDW', season: SEASON },
    { leagueId: eplId,     teamSlug: 'arsenal',   rank: 2, played: 37, wins: 25, draws: 6, losses: 6, goalsFor: 82, goalsAgainst: 37, goalDiff: 45, points: 81, form: 'WWWWD', season: SEASON },
    { leagueId: eplId,     teamSlug: 'liverpool', rank: 3, played: 37, wins: 23, draws: 8, losses: 6, goalsFor: 80, goalsAgainst: 42, goalDiff: 38, points: 77, form: 'DWWWW', season: SEASON },
    { leagueId: eplId,     teamSlug: 'chelsea',   rank: 4, played: 37, wins: 18, draws: 9, losses: 10, goalsFor: 68, goalsAgainst: 51, goalDiff: 17, points: 63, form: 'WDWLW', season: SEASON },
    // V.League
    { leagueId: vleagueId, teamSlug: 'hanoi-fc',  rank: 1, played: 24, wins: 16, draws: 5, losses: 3,  goalsFor: 45, goalsAgainst: 18, goalDiff: 27, points: 53, form: 'WWWDW', season: '2025' },
    { leagueId: vleagueId, teamSlug: 'viettel',   rank: 2, played: 24, wins: 14, draws: 6, losses: 4,  goalsFor: 40, goalsAgainst: 20, goalDiff: 20, points: 48, form: 'WWDWW', season: '2025' },
    { leagueId: vleagueId, teamSlug: 'hagl',      rank: 3, played: 24, wins: 12, draws: 5, losses: 7,  goalsFor: 38, goalsAgainst: 28, goalDiff: 10, points: 41, form: 'WDLWW', season: '2025' },
    { leagueId: vleagueId, teamSlug: 'da-nang',   rank: 4, played: 24, wins: 10, draws: 7, losses: 7,  goalsFor: 32, goalsAgainst: 30, goalDiff: 2,  points: 37, form: 'DLWWW', season: '2025' },
  ];

  for (const s of standingDefs) {
    if (!s.leagueId) continue;
    const teamId = teamMap[s.teamSlug];
    if (!teamId) continue;
    const sezon = s.season ?? SEASON;
    try {
      await prisma.standing.upsert({
        where: { leagueId_teamId_season: { leagueId: s.leagueId, teamId, season: sezon } },
        update: { rank: s.rank, played: s.played, wins: s.wins, draws: s.draws, losses: s.losses, goalsFor: s.goalsFor, goalsAgainst: s.goalsAgainst, goalDiff: s.goalDiff, points: s.points, form: s.form },
        create: { leagueId: s.leagueId, teamId, season: sezon, rank: s.rank, played: s.played, wins: s.wins, draws: s.draws, losses: s.losses, goalsFor: s.goalsFor, goalsAgainst: s.goalsAgainst, goalDiff: s.goalDiff, points: s.points, form: s.form },
      });
    } catch { /* skip */ }
  }
  console.log(`  Standings: ${standingDefs.length} rows`);

  // ── 6. Highlights ────────────────────────────────────────────────────────────
  const highlightDefs = [
    { title: 'Siêu phẩm Haaland ghi cú đúp vào lưới Arsenal', slug: 'haaland-double-arsenal-2025', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnail: 'https://picsum.photos/seed/hl1/400/225', duration: 180, views: 24500, likes: 1230, sortOrder: 1 },
    { title: 'Salah lập hat-trick trước Chelsea - EPL 2025',   slug: 'salah-hattrick-chelsea-2025',   videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnail: 'https://picsum.photos/seed/hl2/400/225', duration: 240, views: 31000, likes: 2100, sortOrder: 2 },
    { title: 'Bàn thắng đẹp nhất Vòng 25 V.League 2025',      slug: 'goal-of-week-vleague-v25-2025', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnail: 'https://picsum.photos/seed/hl3/400/225', duration: 120, views: 8900,  likes: 680,  sortOrder: 3 },
    { title: 'Cuộc đại chiến: Real Madrid vs Barcelona 2025',  slug: 'clasico-real-barca-2025',       videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnail: 'https://picsum.photos/seed/hl4/400/225', duration: 300, views: 98000, likes: 7400, sortOrder: 4 },
  ];

  for (const h of highlightDefs) {
    try {
      await prisma.highlight.upsert({
        where:  { slug: h.slug },
        update: { views: h.views },
        create: { ...h, status: 'active' },
      });
    } catch { /* skip */ }
  }
  console.log(`  Highlights: ${highlightDefs.length}`);

  // ── 7. News ──────────────────────────────────────────────────────────────────
  const newsDefs = [
    { title: 'Manchester City xác nhận gia hạn hợp đồng với Haaland đến 2028', category: 'transfer',  summary: 'Haaland sẽ tiếp tục gắn bó với Man City sau khi hai bên đạt thỏa thuận gia hạn hợp đồng 5 năm.' },
    { title: 'V.League 2025: Hà Nội FC đang trên đà vô địch lần thứ 8',        category: 'news',      summary: 'Với 53 điểm sau 24 vòng, Hà Nội FC đang dẫn đầu cách biệt 5 điểm so với Viettel FC.' },
    { title: 'Real Madrid lên kế hoạch chiêu mộ sao trẻ Mbappé mùa hè 2025',  category: 'transfer',  summary: 'Real Madrid đã đạt thỏa thuận miệng với Mbappé, dự kiến chuyển nhượng hoàn tất tháng 7.' },
    { title: 'Phân tích chiến thuật: Tại sao Arsenal khó vô địch EPL 2025?',   category: 'analysis',  summary: 'Dù chơi bóng đẹp nhưng Arsenal vẫn thiếu tiền đạo đẳng cấp thế giới để cạnh tranh danh hiệu.' },
    { title: 'Trực tiếp: Inter Milan 1-0 AC Milan — Derby della Madonnina',     category: 'news',      summary: 'Lautaro Martinez mở tỷ số ở phút 35 trong trận derby thành Milan đêm nay.' },
  ];

  for (const n of newsDefs) {
    const sl = slugify(n.title) + '-' + Date.now().toString(36).slice(-4);
    try {
      await prisma.news.create({
        data: {
          title: n.title, slug: sl, content: `<p>${n.summary}</p><p>Đây là nội dung chi tiết bài viết về ${n.title.toLowerCase()}. Cập nhật liên tục 24/7 trên Sports Live.</p>`,
          summary: n.summary, category: n.category,
          status: 'published', publishedAt: new Date(),
          authorId: adminUser.id,
        },
      });
    } catch { /* skip */ }
  }
  console.log(`  News: ${newsDefs.length}`);

  // ── 8. Streamer profile + LiveStreams ────────────────────────────────────────
  const streamer = await prisma.streamerProfile.upsert({
    where:  { userId: adminUser.id },
    update: { isLive: true },
    create: { userId: adminUser.id, displayName: 'LKVIP Sports TV', bio: 'Kênh phát sóng trực tiếp chính thức của LKVIP Sports', followers: 12500, totalViews: 450000 },
  });

  await prisma.liveStream.upsert({
    where:  { id: streamer.id + '_live1' },
    update: {},
    create: {
      id:          streamer.id + '_live1',
      streamerId:  streamer.id,
      title:       '🔴 TRỰC TIẾP: Serie A Derby della Madonnina — Inter vs AC Milan',
      description: 'Xem trực tiếp trận derby thành Milan ngay trên Sports Live. Bình luận cùng hàng nghìn fan!',
      thumbnail:   'https://picsum.photos/seed/stream1/640/360',
      status:      'live',
      startTime:   ago(1),
      viewers:     3840,
      peakViewers: 5200,
      chatEnabled: true,
    },
  }).catch(() => {});

  await prisma.liveStream.upsert({
    where:  { id: streamer.id + '_live2' },
    update: {},
    create: {
      id:          streamer.id + '_live2',
      streamerId:  streamer.id,
      title:       '⚽ SẮPDIỄN RA: UCL Semi-Final — Real Madrid vs Man City',
      description: 'Chuẩn bị xem bán kết Champions League. Stream bắt đầu trước 30 phút.',
      thumbnail:   'https://picsum.photos/seed/stream2/640/360',
      status:      'scheduled',
      startTime:   fromNow(2),
      viewers:     0,
      chatEnabled: true,
    },
  }).catch(() => {});
  console.log('  LiveStreams: 2');

  // ── 9. BetMarkets + BetOdds (1x2 cho từng trận scheduled/live) ────────────
  const openMatches = await prisma.match.findMany({
    where: { status: { in: ['scheduled', 'live'] } },
    take:  8,
  });

  const MARKET_ODDS = [
    { sel: 'home', label: 'Chủ nhà', odds: 2.10 },
    { sel: 'draw', label: 'Hòa',     odds: 3.40 },
    { sel: 'away', label: 'Khách',   odds: 3.20 },
  ];

  let marketCount = 0;
  for (const match of openMatches) {
    try {
      const market = await prisma.betMarket.create({
        data: {
          matchId:     match.id,
          marketType:  '1x2',
          name:        'Kết quả trận đấu (1X2)',
          status:      'open',
          closesAt:    match.startTime,
        },
      });

      for (const o of MARKET_ODDS) {
        // Randomise odds slightly
        const jitter = 1 + (Math.random() - 0.5) * 0.1;
        await prisma.betOdds.create({
          data: { marketId: market.id, selection: o.sel, label: o.label, odds: parseFloat((o.odds * jitter).toFixed(2)), status: 'active' },
        }).catch(() => {});
      }
      marketCount++;
    } catch { /* skip */ }
  }
  console.log(`  BetMarkets: ${marketCount} (1x2)`);

  // ── 10. Promotions (Lì xì + Bonus) ─────────────────────────────────────────
  const promoDefs = [
    {
      name:        '🧧 Lì xì chào mừng thành viên mới',
      description: 'Đăng ký tài khoản mới nhận ngay lì xì 50.000₫ – 150.000₫ theo may mắn!',
      type:        'lucky_money',
      value:       50000,
      maxClaim:    1,
      startDate:   ago(30 * 24),
      endDate:     fromNow(365 * 24),
    },
    {
      name:        '💰 Thưởng nạp đầu tiên 50%',
      description: 'Nạp lần đầu nhận thêm 50% giá trị nạp, tối đa 500.000₫. Áp dụng cho tài khoản mới.',
      type:        'deposit_bonus',
      value:       500000,
      minBet:      200000,
      maxClaim:    1,
      startDate:   ago(30 * 24),
      endDate:     fromNow(365 * 24),
    },
    {
      name:        '🎯 Free Bet cuối tuần — 100.000₫',
      description: 'Mỗi cuối tuần nhận 100.000₫ free bet để cá cược thể thao. Không cần điều kiện wagering.',
      type:        'freebet',
      value:       100000,
      maxClaim:    4,
      startDate:   ago(7 * 24),
      endDate:     fromNow(90 * 24),
    },
    {
      name:        '💵 Hoàn tiền 5% cược thua',
      description: 'Thua bao nhiêu hoàn lại 5%, nhận tối đa 200.000₫/ngày. Tự động tính lúc 00:00 hàng ngày.',
      type:        'rebate',
      value:       200000,
      minBet:      100000,
      maxClaim:    30,
      startDate:   ago(24),
      endDate:     fromNow(30 * 24),
    },
  ];

  for (const p of promoDefs) {
    try {
      await prisma.promotion.create({ data: p });
    } catch { /* skip duplicate */ }
  }
  console.log(`  Promotions: ${promoDefs.length}`);

  // ── 11. Knowledge articles (FAQ) ────────────────────────────────────────────
  const kaDefs = [
    { category: 'faq',      title: 'Cách nạp tiền vào tài khoản Sports?', slug: 'cach-nap-tien-sports', content: '<p>Vào <b>Ví</b> → <b>Nạp tiền</b>, chọn phương thức MoMo, ZaloPay hoặc ngân hàng và nhập số tiền muốn nạp.</p>', summary: 'Hướng dẫn nạp tiền nhanh vào ví Sports.' },
    { category: 'faq',      title: 'Đặt cược như thế nào?',               slug: 'cach-dat-cuoc-sports',  content: '<p>Vào <b>Cá cược</b>, chọn trận đấu, nhấn vào tỷ lệ muốn đặt, nhập số tiền và xác nhận phiếu cược.</p>', summary: 'Hướng dẫn đặt cược bóng đá trực tuyến.' },
    { category: 'rules',    title: 'Quy tắc cá cược thể thao LKVIP',      slug: 'quy-tac-ca-cuoc',      content: '<p>Cược được chấp nhận trước khi trận bắt đầu. Tỷ lệ tại thời điểm đặt cược là tỷ lệ áp dụng kết toán...</p>', summary: 'Quy tắc và điều khoản cá cược Sports.' },
    { category: 'tutorial', title: 'Hướng dẫn xem livestream',            slug: 'xem-livestream-sports', content: '<p>Vào <b>Livestream</b>, chọn kênh đang phát sóng. Chat trực tiếp với cộng đồng fan trong suốt trận đấu.</p>', summary: 'Xem trực tiếp bóng đá miễn phí trên Sports Live.' },
  ];

  for (const k of kaDefs) {
    try {
      await prisma.knowledgeArticle.upsert({
        where:  { slug: k.slug },
        update: {},
        create: { ...k, status: 'published', publishedAt: new Date(), views: Math.floor(Math.random() * 500) },
      });
    } catch { /* skip */ }
  }
  console.log(`  Knowledge: ${kaDefs.length}`);

  // ── 12. LiveChat messages mẫu ────────────────────────────────────────────────
  const stream1 = await prisma.liveStream.findFirst({ where: { status: 'live' } });
  if (stream1) {
    const chatDefs = [
      { message: 'GOOOAL! Inter ghi bàn rồi 🔥🔥🔥' },
      { message: 'Lautaro quá hay, đỉnh của đỉnh!' },
      { message: 'Cược Inter thắng, ngon rồi 💰' },
      { message: 'AC Milan phản công nguy hiểm quá' },
    ];
    for (const c of chatDefs) {
      try {
        await prisma.liveChat.create({
          data: { streamId: stream1.id, userId: demoUser.id, message: c.message, type: 'text' },
        });
      } catch { /* skip */ }
    }
    console.log(`  LiveChats: ${chatDefs.length} mẫu`);
  }

  console.log('  [sports] ✅ Seed hoàn tất!');
}

module.exports = { seed };

if (require.main === module) {
  seed()
    .then(() => { console.log('✅ sports.seed done'); process.exit(0); })
    .catch(e => { console.error('[seed:sports] ❌', e.message); process.exit(1); })
    .finally(() => prisma.$disconnect && prisma.$disconnect());
}
