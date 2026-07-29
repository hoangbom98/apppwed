'use strict';
const Decimal = require('decimal.js');

class AcademyService {
  prisma: any;

  constructor(prisma: any) {
    this.prisma = prisma;
  }

  async getCourses(filters: Record<string, any> = {}) {
    const where: Record<string, any> = { status: 'published' };
    if (filters.level) where.level = filters.level;
    return await this.prisma.course.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async getCourseDetail(slug) {
    return await this.prisma.course.findUnique({
      where: { slug },
      include: { lessons: { orderBy: { order: 'asc' } } }
    });
  }

  async enrollCourse(userId, courseId, referenceId, walletService) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new Error('Course not found');

    // Debit payment if price > 0
    if (new Decimal(course.price).gt(0)) {
      await walletService.debit(userId, course.price, `Enroll course: ${course.title}`);
    }

    return await this.prisma.enrollment.create({
      data: {
        userId,
        courseId,
        referenceId,
        paidAmount: course.price,
        status: 'active'
      }
    });
  }

  async getMyEnrollments(userId) {
    return await this.prisma.enrollment.findMany({
      where: { userId },
      include: { course: true }
    });
  }

  async updateProgress(userId, enrollmentId, lessonId, watchedSecs) {
    return await this.prisma.courseProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
      update: { watchedSecs },
      create: { userId, enrollmentId, lessonId, watchedSecs }
    });
  }
}

module.exports = AcademyService;
