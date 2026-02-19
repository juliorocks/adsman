
export interface ActivityLog {
    id: string;
    user_id: string;
    action_type: 'PAUSE' | 'ACTIVATE' | 'BUDGET' | 'CREATIVE' | 'OPTIMIZATION' | 'CRITICAL' | 'OTHER';
    description: string;
    target_id?: string;
    target_name?: string;
    agent: 'AUDITOR' | 'CREATIVE' | 'STRATEGIST' | 'USER' | 'SYSTEM';
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    created_at: string;
    metadata?: any;
}
