import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { normalizeArabicName } from "shared";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "demo-pass-1";

const CLASSES = ["10A", "10B", "11A"];

const STUDENT_NAMES: Record<string, string[]> = {
  "10A": ["سارة أحمد", "عمر خليل", "لينا حداد", "يوسف منصور", "رنا سالم", "خالد نور", "هدى فارس", "زياد قاسم"],
  "10B": ["مريم شاهين", "طارق يوسف", "نور الدين حسن", "ريم عودة", "باسل نجار", "دانة عيسى", "فراس دياب", "سلمى بركات"],
  "11A": ["أمل نصار", "كريم حمدان", "ياسمين شحادة", "وائل صالح", "لارا مراد", "حمزة زيدان", "جود عبدالله", "تالا صيام"],
};

const TEACHER_NAMES = ["Amal Nasser", "Fadi Karam", "Rania Saleh", "Bassam Odeh"];

async function main() {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log("Seed skipped: database already has users.");
    return;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  await prisma.user.create({
    data: {
      role: "ADMIN",
      name: "Demo Admin",
      nameNormalized: normalizeArabicName("Demo Admin"),
      username: "demo-admin",
      passwordHash,
    },
  });

  const teachers = [];
  for (const name of TEACHER_NAMES) {
    const username = `t-${name.split(" ")[0]!.toLowerCase()}`;
    // eslint-disable-next-line no-await-in-loop -- one-off seed script, sequential is fine
    const teacher = await prisma.user.create({
      data: { role: "TEACHER", name, nameNormalized: normalizeArabicName(name), username, passwordHash },
    });
    teachers.push(teacher);
  }

  const classesByName = new Map<string, { id: string }>();
  for (const name of CLASSES) {
    // eslint-disable-next-line no-await-in-loop
    const klass = await prisma.class.create({ data: { name } });
    classesByName.set(name, klass);
  }

  for (const className of CLASSES) {
    const classId = classesByName.get(className)!.id;
    const names = STUDENT_NAMES[className]!;
    for (let i = 0; i < names.length; i++) {
      const username = `S${className}${String(i + 1).padStart(2, "0")}`;
      const name = names[i]!;
      // eslint-disable-next-line no-await-in-loop
      await prisma.user.create({
        data: { role: "STUDENT", name, nameNormalized: normalizeArabicName(name), username, passwordHash, classId },
      });
    }
  }

  const now = new Date();
  const opensAt = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const closesAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const arabicQuiz = await prisma.quiz.create({
    data: {
      title: "اختبار الرياضيات - الوحدة الأولى",
      ownerTeacherId: teachers[0]!.id,
      status: "PUBLISHED",
      opensAt,
      closesAt,
      timeLimitMinutes: 20,
      negMarkEnabled: true,
      negMarkPenalty: 0.25,
      classes: { create: [{ classId: classesByName.get("10A")!.id }] },
    },
  });

  await prisma.question.create({
    data: {
      quizId: arabicQuiz.id,
      text: "كم يساوي ٢ + ٢؟",
      points: 10,
      orderIndex: 0,
      options: {
        create: [
          { text: "٣", isCorrect: false, orderIndex: 0 },
          { text: "٤", isCorrect: true, orderIndex: 1 },
          { text: "٥", isCorrect: false, orderIndex: 2 },
          { text: "٢٢", isCorrect: false, orderIndex: 3 },
        ],
      },
    },
  });

  const englishQuiz = await prisma.quiz.create({
    data: {
      title: "English Grammar Basics",
      ownerTeacherId: teachers[1]!.id,
      status: "PUBLISHED",
      opensAt,
      closesAt,
      timeLimitMinutes: 20,
      negMarkEnabled: false,
      negMarkPenalty: 0,
      classes: { create: [{ classId: classesByName.get("10B")!.id }] },
    },
  });

  await prisma.question.create({
    data: {
      quizId: englishQuiz.id,
      text: "Which word is a noun?",
      points: 10,
      orderIndex: 0,
      options: {
        create: [
          { text: "Quickly", isCorrect: false, orderIndex: 0 },
          { text: "Run", isCorrect: false, orderIndex: 1 },
          { text: "Table", isCorrect: true, orderIndex: 2 },
          { text: "Beautiful", isCorrect: false, orderIndex: 3 },
        ],
      },
    },
  });

  console.log("Seed complete: 1 admin, 4 teachers, 3 classes, 24 students, 2 quizzes.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
