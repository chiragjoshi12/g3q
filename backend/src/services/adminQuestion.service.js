import { AppError, ERROR_CODE } from '../utils/appError.js';
import { BankQuestionModel } from '../models/BankQuestionModel.js';

const buildListWhere = ({ language, review_status, q, correct_option }) => {
  const where = {};

  if (review_status && review_status !== 'all') {
    where.reviewStatus = review_status;
  }

  if (correct_option) {
    where.correctOption = correct_option;
  }

  if (language === 'both') {
    where.AND = [
      { questionGu: { not: null } },
      { questionEn: { not: null } },
    ];
  } else if (language === 'gu_only') {
    where.AND = [{ questionGu: { not: null } }, { questionEn: null }];
  } else if (language === 'en_only') {
    where.AND = [{ questionEn: { not: null } }, { questionGu: null }];
  }

  if (q) {
    where.OR = [
      { queId: { contains: q } },
      { questionGu: { contains: q } },
      { questionEn: { contains: q } },
      { departmentGu: { contains: q } },
      { departmentEn: { contains: q } },
    ];
  }

  return where;
};

export const adminQuestionService = {
  async stats() {
    return BankQuestionModel.stats();
  },

  async list(query) {
    const where = buildListWhere(query);
    return BankQuestionModel.list({
      where,
      page: query.page,
      pageSize: query.page_size,
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
    return BankQuestionModel.review(queId, body, admin);
  },

  async comment(queId, body, admin) {
    const exists = await BankQuestionModel.findRowByQueId(queId);
    if (!exists) throw new AppError(ERROR_CODE.NOT_FOUND, 'Question not found.');
    return BankQuestionModel.addComment(queId, body.body, admin);
  },
};
