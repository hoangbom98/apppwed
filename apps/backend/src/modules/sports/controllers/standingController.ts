'use strict';
const { success, error } = require('../../../shared/utils/network/response');

exports.getByLeague = async (req, res) => {
  try {
    const leagueId = req.params.leagueId;                     // CUID string
    const season   = req.query.season || new Date().getFullYear().toString();

    const standings = await req.prisma.standing.findMany({
      where:   { leagueId, season },
      orderBy: { rank: 'asc' },
      include: { team: { select: { id: true, name: true, slug: true, logo: true } } },
    });

    return success(res, { standings, season });
  } catch (e) {
    return error(res, e.message, 500);
  }
};
