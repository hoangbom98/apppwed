const BaseService = require('../../../shared/services/BaseService');

class UserService extends BaseService {
  constructor(prisma) {
    super(prisma, 'user');
  }

  async getFullProfile(userId, viewerId) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { albums: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!user) throw new Error('User not found');
    if (viewerId !== userId) {
      delete user.email;
      delete user.phone;
    }
    return user;
  }

  async updateProfile(userId, data) {
    // Logic: calculate age from birthDate
    const birthDate = new Date(data.birthDate);
    const age = new Date().getFullYear() - birthDate.getFullYear();
    
    return this.prisma.user.update({
      where: { id: userId },
      data: { ...data, age },
    });
  }

  async addAlbum(userId, url, type = 'image', isPrivate = false) {
    const count = await this.prisma.album.count({ where: { userId } });
    return this.prisma.album.create({
      data: {
        userId,
        url,
        type,
        isPrivate,
        sortOrder: count,
      },
    });
  }

  async deleteAlbum(albumId, userId) {
    const album = await this.prisma.album.findUnique({ where: { id: albumId } });
    if (!album) throw new Error('Album not found');
    if (album.userId !== userId) throw new Error('Unauthorized');
    return this.prisma.album.delete({ where: { id: albumId } });
  }
}
module.exports = UserService;
