// src/modules/sports/controllers/sports.controller.ts
import { Request, Response } from 'express';
import { sportsService } from '../services/sports.service';

export class SportsController {
  async syncEvents(req: Request, res: Response) {
    const { date } = req.body;
    const result = await sportsService.syncEvents(req.projectId, date);
    res.json(result);
  }

  async getEvents(req: Request, res: Response) {
    const filters = req.query;
    const events = await sportsService.getEvents(req.projectId, filters);
    res.json(events);
  }
}
