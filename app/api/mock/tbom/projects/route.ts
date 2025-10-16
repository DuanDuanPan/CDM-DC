import { NextResponse } from 'next/server';
import { readJsonFile, serverError } from '../utils';

type Project = {
  project_id: string;
};

export const dynamic = 'force-static';

export async function GET() {
  try {
    const projects = await readJsonFile<Project[]>('tbom_project.json');
    return NextResponse.json({ data: projects });
  } catch (error) {
    return serverError(error);
  }
}
