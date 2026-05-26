import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, unlink, mkdtemp } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  // Check pandoc is available
  try {
    await execAsync("pandoc --version");
  } catch {
    return NextResponse.json(
      { error: "pandoc is not installed on this server. Install it with: brew install pandoc" },
      { status: 500 }
    );
  }

  // Parse multipart form
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!file.name.endsWith(".docx")) {
    return NextResponse.json({ error: "Only .docx files are supported" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
  }

  // Write to a temp directory
  const tmpDir = await mkdtemp(join(tmpdir(), "latexci-"));
  const inputPath = join(tmpDir, "input.docx");
  const outputPath = join(tmpDir, "output.tex");

  try {
    const bytes = await file.arrayBuffer();
    await writeFile(inputPath, Buffer.from(bytes));

    // Run pandoc conversion
    await execAsync(
      `pandoc "${inputPath}" --from docx --to latex --output "${outputPath}" --wrap=none`
    );

    const latex = await readFile(outputPath, "utf-8");

    // Cleanup
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});

    return NextResponse.json({ latex });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Conversion failed: ${message}` },
      { status: 500 }
    );
  }
}
