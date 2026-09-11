import { AppError, ERROR_CODE } from '../utils/appError.js';
import { ADMIN_ROLE } from '../config/admin.roles.js';
import { BankQuestionModel } from '../models/BankQuestionModel.js';
import { AdminWorkModel } from '../models/AdminWorkModel.js';

const buildListWhere = ({ review_status, correct_option, assigned_to, has_comments }, admin) => {
  const where = {};

  if (review_status && review_status !== 'all') {
    where.reviewStatus = review_status;
  }

  // correct_option filter skipped (payload JSON); kept for API compat without erroring.

  const assigned = assigned_to && assigned_to !== 'all' ? assigned_to : null;
  if (assigned === 'mine') {
    where.assignment = { is: { adminId: admin.id } };
  } else if (assigned === 'unassigned') {
    where.assignment = { is: null };
  } else if (assigned && /^\d+$/.test(assigned)) {
    where.assignment = { is: { adminId: Number(assigned) } };
  }

  if (has_comments === 'yes') {
    where.comments = { some: {} };
  } else if (has_comments === 'no') {
    where.comments = { none: {} };
  }

  return where;
};

export const adminQuestionService = {
  async stats() {
    return BankQuestionModel.stats();
  },

  async list(query, admin) {
    const where = buildListWhere(query, admin);
    return BankQuestionModel.list({
      where,
      page: query.page,
      pageSize: query.page_size,
      language: query.language,
      q: query.q,
    });
  },

  async get(queId) {
    const detail = await BankQuestionModel.findByQueId(queId);
    if (!detail) throw new AppError(ERROR_CODE.NOT_FOUND, 'Question not found.');
    return detail;
  },

  async update(queId, payload, admin) {
    const exists = await BankQuestionModel.findRowByQueId(queId);
    if (!exists) throw new AppError(ERROR_CODE.NOT_FOUND, 'Question not found.');
    return BankQuestionModel.update(queId, payload, admin);
  },

  async review(queId, body, admin) {
    const exists = await BankQuestionModel.findRowByQueId(queId);
    if (!exists) throw new AppError(ERROR_CODE.NOT_FOUND, 'Question not found.');
    if (admin.role !== ADMIN_ROLE.MASTER) {
      const assignment = await AdminWorkModel.findAssignment(queId);
      if (assignment && assignment.adminId !== admin.id) {
        throw new AppError(
          ERROR_CODE.FORBIDDEN,
          'This question is assigned to another reviewer.'
        );
      }
    }
    return BankQuestionModel.review(queId, body, admin);
  },

  async comment(queId, body, admin) {
    const exists = await BankQuestionModel.findRowByQueId(queId);
    if (!exists) throw new AppError(ERROR_CODE.NOT_FOUND, 'Question not found.');
    return BankQuestionModel.addComment(queId, body.body, admin);
  },

  async deleteComment(queId, commentId, admin) {
    const exists = await BankQuestionModel.findRowByQueId(queId);
    if (!exists) throw new AppError(ERROR_CODE.NOT_FOUND, 'Question not found.');
    const comment = await BankQuestionModel.findComment(queId, commentId);
    if (!comment) throw new AppError(ERROR_CODE.NOT_FOUND, 'Comment not found.');
    if (admin.role !== ADMIN_ROLE.MASTER && comment.userId !== admin.id) {
      throw new AppError(ERROR_CODE.FORBIDDEN, 'You can only delete your own comments.');
    }
    return BankQuestionModel.deleteComment(queId, commentId);
  },
};
