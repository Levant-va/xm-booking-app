import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { AuditLog } from '@/lib/models';

export async function GET() {
  try {
    await connectDB();

    const auditLogs = await AuditLog.find({}).sort({ timestamp: -1 });
    
    return NextResponse.json({
      logs: auditLogs,
      success: true,
    });

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}