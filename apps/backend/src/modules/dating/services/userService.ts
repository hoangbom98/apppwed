const BaseService = require('../../../shared/services/BaseService');

interface Album {
  userId: string;
  url: string;
  type: string;
  isPrivate: boolean;
  sortOrder: number;
  id?: string;
}

class UserService extends BaseService {
  constructor(prisma: unknown) {
    super(prisma, 'user');
  }

  async getFullProfile(userId: string, viewerId: string): Promise<Record<string, unknown>> {
    const user: Record<string, unknown> = await this.prisma.user.findUnique({
      where:   { id: userId },
      include: { albums: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!user) throw new Error('User not found');
    if (viewerId !== userId) {
      delete user.email;
      delete user.phone;
    }
    return user;
  }

  async updateProfile(userId: string, data: Record<string, unknown>): Promise<unknown> {
    // Recalculate age from birthDate if provided
    const updateData: Record<string, unknown> = { ...data };
    if (data.birthDate) {
      const birthDate = new Date(data.birthDate as string);
      updateData.age  = new Date().getFullYear() - birthDate.getFullYear();
    }
    return this.prisma.user.update({ where: { id: userId }, data: updateData });
  }

  async addAlbum(userId: string, url: string, type = 'image', isPrivate = false): Promise<Album> {
    const count = await this.prisma.album.count({ where: { userId } });
    return this.prisma.album.create({
      data: { userId, url, type, isPrivate, sortOrder: count },
    });
  }

  async deleteAlbum(albumId: string, userId: string): Promise<Album> {
    const album: Album | null = await this.prisma.album.findUnique({ where: { id: albumId } });
    if (!album)               throw new Error('Album not found');
    if (album.userId !== userId) throw new Error('Unauthorized');
    return this.prisma.album.delete({ where: { id: albumId } });
  }
}

module.exports = UserService;
