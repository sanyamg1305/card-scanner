import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const pdfPath = path.join(process.cwd(), 'Cersaie_2026_Exhibition_Leads_Dossier.pdf');

    if (!fs.existsSync(pdfPath)) {
      return NextResponse.json(
        { error: 'PDF report not found. Please regenerate it.' },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(pdfPath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Cersaie_2026_Exhibition_Leads_Dossier.pdf"',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to serve PDF' }, { status: 500 });
  }
}
