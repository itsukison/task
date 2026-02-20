import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listTasks, createTaskPreview, updateTaskPreview } from '@/lib/ai/tools/task-tools';
import { getCalendarBlocks, suggestReschedule, scheduleTask } from '@/lib/ai/tools/calendar-tools';
import { getDocumentContent, searchInDocuments } from '@/lib/ai/tools/document-tools';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        // 1. Authenticate the request
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get organization ID (assuming currently active org, or you could pass it in)
        // For simplicity, we fallback to finding their first active org if not passed.
        let organizationId = req.headers.get('x-organization-id');

        if (!organizationId) {
            const { data: profiles } = await supabase
                .from('organization_members')
                .select('organization_id')
                .eq('user_id', user.id)
                .limit(1);
            if (profiles && profiles.length > 0) {
                organizationId = profiles[0].organization_id;
            } else {
                return NextResponse.json({ error: 'No organization found' }, { status: 400 });
            }
        }

        const body = await req.json();
        const { tool_name, arguments: args, context } = body;

        console.log(`🌐 WebMCP Gateway: Executing ${tool_name} for ${user.id}`);

        switch (tool_name) {
            // Read Tools
            case 'list_tasks': {
                const result = await listTasks(
                    organizationId!,
                    user.id,
                    args.status,
                    args.scheduled_date
                );
                return NextResponse.json({ result });
            }
            case 'get_calendar_blocks': {
                const result = await getCalendarBlocks(
                    organizationId!,
                    user.id,
                    args.start_date,
                    args.end_date
                );
                return NextResponse.json({ result });
            }
            case 'get_document_content': {
                const docResult = await getDocumentContent(args.document_id, undefined);
                return NextResponse.json({ result: docResult.content });
            }
            case 'search_in_documents': {
                const result = await searchInDocuments(args.query, args.document_ids);
                return NextResponse.json({ result });
            }

            // Write Tools (Previews)
            case 'create_task': {
                const preview = await createTaskPreview(args);
                return NextResponse.json({ preview });
            }
            case 'update_task': {
                const preview = await updateTaskPreview(args);
                return NextResponse.json({ preview });
            }
            case 'schedule_task': {
                const preview = await scheduleTask(
                    args.task_id,
                    args.preferred_date,
                    args.preferred_start_time,
                    args.search_days,
                    context || { organizationId, userId: user.id }
                );
                return NextResponse.json({ preview });
            }
            case 'suggest_reschedule': {
                const preview = await suggestReschedule(args);
                return NextResponse.json({ preview });
            }

            default:
                return NextResponse.json({ error: `Tool ${tool_name} not found or not supported via Gateway` }, { status: 404 });
        }

    } catch (error: any) {
        console.error('WebMCP Gateway Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
