// File parsing utilities
// Extracts text content from uploaded files (PDF, Excel, PPT)

export async function parseFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const ext = fileName.split(".").pop()?.toLowerCase();

  try {
    if (ext === "pdf" || mimeType === "application/pdf") {
      return await parsePDF(buffer);
    } else if (
      ext === "xlsx" ||
      ext === "xls" ||
      mimeType.includes("spreadsheet")
    ) {
      return await parseExcel(buffer);
    } else if (
      ext === "pptx" ||
      ext === "ppt" ||
      mimeType.includes("presentation")
    ) {
      return await parsePPTX(buffer);
    } else if (
      ext === "docx" ||
      ext === "doc" ||
      mimeType.includes("document")
    ) {
      return await parseDOCX(buffer);
    } else if (ext === "txt" || ext === "csv" || mimeType.includes("text")) {
      return buffer.toString("utf-8");
    } else {
      return `[파일 형식 미지원: ${fileName}]`;
    }
  } catch (error) {
    console.error(`Error parsing ${fileName}:`, error);
    return `[파일 파싱 실패: ${fileName}]`;
  }
}

async function parsePDF(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return data.text;
}

async function parseExcel(buffer: Buffer): Promise<string> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, { type: "buffer" });
  let result = "";

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    result += `\n=== Sheet: ${sheetName} ===\n${csv}\n`;
  }

  return result;
}

async function parsePPTX(buffer: Buffer): Promise<string> {
  // Using mammoth as a basic extractor; for production, use python-pptx or markitdown
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "[PPT 텍스트 추출 실패]";
  } catch {
    return "[PPT 파싱: mammoth 미지원 형식. markitdown으로 전환 필요]";
  }
}

async function parseDOCX(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

// Detect file category from name
export function detectFileCategory(
  fileName: string
): "pitchdeck" | "financials" | "captable" | "screenshot" | "other" {
  const lower = fileName.toLowerCase();

  if (lower.includes("pitch") || lower.includes("deck") || lower.includes("ir"))
    return "pitchdeck";
  if (
    lower.includes("financial") ||
    lower.includes("재무") ||
    lower.includes("revenue") ||
    lower.includes("p&l") ||
    lower.includes("pl")
  )
    return "financials";
  if (lower.includes("cap") || lower.includes("지분"))
    return "captable";
  if (
    lower.match(/\.(png|jpg|jpeg|gif|webp)$/)
  )
    return "screenshot";

  return "other";
}
