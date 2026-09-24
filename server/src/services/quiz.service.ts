import { Decimal } from "../repositories/decimal.js";
import type { QuestionInput, QuizSettingsInput, QuizSettingsUpdateInput } from "shared";
import {
  createQuizForTeacher,
  findQuizForTeacher,
  listQuizzesForTeacher,
  isQuizLocked,
  updateQuiz,
  setQuizStatus,
  countQuestions,
  findQuestionForQuiz,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  type QuizWithQuestions,
} from "../repositories/quiz.repository.js";
import { findById } from "../repositories/user.repository.js";
import { listActiveClasses } from "../repositories/class.repository.js";
import { ForbiddenError, NotFoundError, QuizLockedError, ValidationError } from "../errors/index.js";

// Ownership check reads as "not found" either way (the repository query
// already filters by ownerTeacherId), so a non-owner's request and a
// malformed/nonexistent id are indistinguishable (contracts/teacher-quizzes.md).
async function requireOwnedQuiz(quizId: string, teacherId: string): Promise<QuizWithQuestions> {
  const quiz = await findQuizForTeacher(quizId, teacherId);
  if (!quiz) {
    throw new ForbiddenError("You don't own this quiz.");
  }
  return quiz;
}

async function requireUnlocked(quizId: string) {
  if (await isQuizLocked(quizId)) {
    throw new QuizLockedError("This quiz has attempts — only its open/close dates can still be changed.");
  }
}

// Every active class is a valid target for any teacher's quiz — classes
// aren't owned by a specific teacher, so no ownership filter applies here.
export async function listClassesForPicker() {
  const classes = await listActiveClasses();
  return classes.map((c) => ({ id: c.id, name: c.name }));
}

export async function listForTeacher(teacherId: string) {
  const quizzes = await listQuizzesForTeacher(teacherId);
  return quizzes.map((q) => ({
    id: q.id,
    title: q.title,
    status: q.status,
    classNames: q.classes.map((qc) => qc.class.name),
    attemptCount: q._count.attempts,
    enrolledCount: q.classes.reduce((sum, qc) => sum + qc.class._count.students, 0),
  }));
}

export async function getForEditing(quizId: string, teacherId: string) {
  const quiz = await requireOwnedQuiz(quizId, teacherId);
  return {
    id: quiz.id,
    title: quiz.title,
    status: quiz.status,
    opensAt: quiz.opensAt.toISOString(),
    closesAt: quiz.closesAt.toISOString(),
    timeLimitMinutes: quiz.timeLimitMinutes,
    negMarkEnabled: quiz.negMarkEnabled,
    negMarkPenalty: quiz.negMarkPenalty.toNumber(),
    locked: await isQuizLocked(quizId),
    questions: quiz.questions.map((q) => ({
      id: q.id,
      text: q.text,
      points: q.points.toNumber(),
      options: q.options.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
    })),
  };
}

// negMarkEnabled/negMarkPenalty default from the teacher's own profile
// setting when omitted from the request (FR-012a).
export async function create(teacherId: string, input: QuizSettingsInput) {
  let negMarkEnabled = input.negMarkEnabled;
  let negMarkPenalty = input.negMarkPenalty;
  if (negMarkEnabled === undefined) {
    const teacher = await findById(teacherId);
    negMarkEnabled = teacher?.negMarkDefaultEnabled ?? false;
    negMarkPenalty = negMarkPenalty ?? teacher?.negMarkDefaultPenalty?.toNumber();
  }

  const quiz = await createQuizForTeacher(teacherId, {
    title: input.title,
    classIds: input.classIds,
    opensAt: input.opensAt,
    closesAt: input.closesAt,
    timeLimitMinutes: input.timeLimitMinutes,
    negMarkEnabled: negMarkEnabled ?? false,
    negMarkPenalty: new Decimal(negMarkPenalty ?? 0),
  });
  return { quizId: quiz.id };
}

export async function update(quizId: string, teacherId: string, input: QuizSettingsUpdateInput) {
  await requireOwnedQuiz(quizId, teacherId);
  const touchesNonDateField = Object.keys(input).some((key) => key !== "opensAt" && key !== "closesAt");
  if (touchesNonDateField) {
    await requireUnlocked(quizId);
  }
  await updateQuiz(quizId, {
    ...input,
    negMarkPenalty: input.negMarkPenalty !== undefined ? new Decimal(input.negMarkPenalty) : undefined,
  });
}

function toQuestionResponse(question: { id: string; text: string; points: Decimal; options: Array<{ id: string; text: string; isCorrect: boolean }> }) {
  return {
    id: question.id,
    text: question.text,
    points: question.points.toNumber(),
    options: question.options.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
  };
}

export async function addQuestion(quizId: string, teacherId: string, input: QuestionInput) {
  await requireOwnedQuiz(quizId, teacherId);
  await requireUnlocked(quizId);
  const question = await createQuestion(quizId, { text: input.text, points: new Decimal(input.points), options: input.options });
  return toQuestionResponse(question);
}

async function requireOwnedQuestion(quizId: string, questionId: string, teacherId: string) {
  await requireOwnedQuiz(quizId, teacherId);
  await requireUnlocked(quizId);
  const question = await findQuestionForQuiz(quizId, questionId);
  if (!question) {
    throw new NotFoundError("Question not found.");
  }
  return question;
}

export async function editQuestion(quizId: string, questionId: string, teacherId: string, input: QuestionInput) {
  await requireOwnedQuestion(quizId, questionId, teacherId);
  const question = await updateQuestion(questionId, { text: input.text, points: new Decimal(input.points), options: input.options });
  return toQuestionResponse(question);
}

export async function removeQuestion(quizId: string, questionId: string, teacherId: string) {
  await requireOwnedQuestion(quizId, questionId, teacherId);
  await deleteQuestion(questionId);
}

export async function publish(quizId: string, teacherId: string) {
  await requireOwnedQuiz(quizId, teacherId);
  const questionCount = await countQuestions(quizId);
  if (questionCount === 0) {
    throw new ValidationError("A quiz needs at least one question before it can be published.");
  }
  await setQuizStatus(quizId, "PUBLISHED");
}

export async function unpublish(quizId: string, teacherId: string) {
  await requireOwnedQuiz(quizId, teacherId);
  await requireUnlocked(quizId);
  await setQuizStatus(quizId, "DRAFT");
}
