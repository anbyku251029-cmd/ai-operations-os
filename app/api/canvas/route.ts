import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'canvas-data.json');

export async function GET() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return NextResponse.json(parsed);
  } catch (error: any) {
    // 저장된 파일이 아직 없으면 기본 상태 유지
    if (error.code === 'ENOENT') {
      return NextResponse.json({ nodes: null, edges: null });
    }
    return NextResponse.json({ error: 'Failed to read canvas data' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { nodes, edges } = await req.json();
    const payload = {
      nodes,
      edges,
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    return NextResponse.json({ success: true, updatedAt: payload.updatedAt });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save canvas data' }, { status: 500 });
  }
}
