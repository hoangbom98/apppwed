'use strict';
const { success, error, notFound } = require('../../../shared/utils/network/response');
const AcademyService = require('../services/academyService');
const Joi = require('joi');

const getAcademyService = (req) => new AcademyService(req.prisma);

exports.getCourses = async (req, res) => {
  try {
    const data = await getAcademyService(req).getCourses(req.query);
    return success(res, data);
  } catch (e) { return error(res, e.message, 500); }
};

exports.getCourseDetail = async (req, res) => {
  try {
    const data = await getAcademyService(req).getCourseDetail(req.params.slug);
    if (!data) return notFound(res);
    return success(res, data);
  } catch (e) { return error(res, e.message, 500); }
};

exports.enrollCourse = async (req, res) => {
  const schema = Joi.object({
    courseId: Joi.string().required(),
    referenceId: Joi.string().required()
  });
  const { error: valError } = schema.validate(req.body);
  if (valError) return error(res, valError.details[0].message, 400);

  try {
    // Assuming walletService is available in req or shared/services
    const walletService = require('../../../shared/services/walletService');
    const data = await getAcademyService(req).enrollCourse(req.user.id, req.body.courseId, req.body.referenceId, walletService);
    return success(res, data, 'Enrolled');
  } catch (e) { return error(res, e.message, 500); }
};

exports.getMyEnrollments = async (req, res) => {
  try {
    const data = await getAcademyService(req).getMyEnrollments(req.user.id);
    return success(res, data);
  } catch (e) { return error(res, e.message, 500); }
};

exports.updateProgress = async (req, res) => {
  const schema = Joi.object({
    watchedSecs: Joi.number().integer().min(0).required()
  });
  const { error: valError } = schema.validate(req.body);
  if (valError) return error(res, valError.details[0].message, 400);

  try {
    const data = await getAcademyService(req).updateProgress(req.user.id, req.params.enrollmentId, req.body.lessonId, req.body.watchedSecs);
    return success(res, data);
  } catch (e) { return error(res, e.message, 500); }
};
