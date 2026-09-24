import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { previewQuizImport } from "../../src/services/import.service.js";
import { ValidationError } from "../../src/errors/index.js";

const HEADER = "Question,Points,OptionA,OptionB,OptionC,OptionD,Correct\n";

function csvBuffer(body: string, withBom = false): Buffer {
  const text = HEADER + body;
  const bom = withBom ? Buffer.from([0xef, 0xbb, 0xbf]) : Buffer.alloc(0);
  return Buffer.concat([bom, Buffer.from(text, "utf-8")]);
}

describe("import.spec: valid rows create accounts/quiz content (quiz variant)", () => {
  it("parses a well-formed CSV into OK rows with the right shape", async () => {
    const buffer = csvBuffer('"What is 2+2?",10,3,4,5,22,B\n"What is 3+3?",5,6,7,8,9,A\n');
    const preview = await previewQuizImport(buffer, "quiz.csv");

    expect(preview.summary.total).toBe(2);
    expect(preview.summary.willImport).toBe(2);
    expect(preview.rows[0]).toMatchObject({
      rowNumber: 1,
      questionText: "What is 2+2?",
      points: 10,
      status: "OK",
    });
    expect(preview.rows[0]?.options).toEqual([
      { text: "3", isCorrect: false },
      { text: "4", isCorrect: true },
      { text: "5", isCorrect: false },
      { text: "22", isCorrect: false },
    ]);
  });

  it("parses a well-formed XLSX workbook the same way", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Quiz");
    sheet.addRow(["Question", "Points", "OptionA", "OptionB", "OptionC", "OptionD", "Correct"]);
    sheet.addRow(["What is 2+2?", 10, "3", "4", "5", "22", "B"]);
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    const preview = await previewQuizImport(buffer, "quiz.xlsx");

    expect(preview.summary.willImport).toBe(1);
    expect(preview.rows[0]?.status).toBe("OK");
    expect(preview.rows[0]?.options[1]).toEqual({ text: "4", isCorrect: true });
  });
});

describe("import.spec: preview shows per-row errors before saving", () => {
  it("flags a row with an invalid Correct letter as an error without failing the whole import", async () => {
    const buffer = csvBuffer('"Good question",10,3,4,5,22,B\n"Bad question",10,3,4,5,22,Z\n');
    const preview = await previewQuizImport(buffer, "quiz.csv");

    expect(preview.summary.total).toBe(2);
    expect(preview.summary.willImport).toBe(1);
    expect(preview.rows[0]?.status).toBe("OK");
    expect(preview.rows[1]?.status).toBe("ERROR");
    expect(preview.rows[1]?.error).toBeTruthy();
  });

  it("flags a row with a missing option as an error", async () => {
    const buffer = csvBuffer('"Missing option",10,3,4,5,,B\n');
    const preview = await previewQuizImport(buffer, "quiz.csv");
    expect(preview.rows[0]?.status).toBe("ERROR");
  });

  it("flags a row with non-numeric points as an error", async () => {
    const buffer = csvBuffer('"Bad points",ten,3,4,5,22,B\n');
    const preview = await previewQuizImport(buffer, "quiz.csv");
    expect(preview.rows[0]?.status).toBe("ERROR");
  });
});

describe("import.spec: only UTF-8 CSV or XLSX is accepted (FR-019a)", () => {
  it("accepts a UTF-8 CSV with a byte-order mark", async () => {
    const buffer = csvBuffer('"With BOM",10,3,4,5,22,A\n', true);
    const preview = await previewQuizImport(buffer, "quiz.csv");
    expect(preview.rows[0]?.status).toBe("OK");
  });

  it("rejects a CSV that isn't valid UTF-8 before parsing any row", async () => {
    // 0xFF 0xFE is not a valid UTF-8 byte sequence.
    const buffer = Buffer.concat([Buffer.from(HEADER, "utf-8"), Buffer.from([0xff, 0xfe, 0x00, 0x0a])]);
    await expect(previewQuizImport(buffer, "quiz.csv")).rejects.toThrow(ValidationError);
  });
});
