'use client';

import { useState } from 'react';
import WorkspaceView from '@/components/workspace-view';
import TaskModal from '@/components/task-modal';
import { Task, CalendarBlock } from '@/lib/types';

// Mock data for initial testing
const INITIAL_TASKS: Task[] = [
    {
        id: '1',
        title: 'Q1 Strategy Review',
        description: 'Deep dive into Q1 metrics and planning for Q2 OKRs. Needs preparation of slides.',
        owner: 'John Smith',
        status: 'planned',
        expectedTime: 90,
        actualTime: 0
    },
    {
        id: '2',
        title: 'Design System Audit',
        description: 'Review the current component library for accessibility issues.',
        owner: 'John Smith',
        status: 'in_progress',
        expectedTime: 120,
        actualTime: 45
    },
    {
        id: '3',
        title: 'Client Sync: Acme Corp',
        description: 'Weekly sync to discuss timeline updates.',
        owner: 'John Smith',
        status: 'planned',
        expectedTime: 30,
        actualTime: 0
    },
    {
        id: '4',
        title: 'Fix Auth Bug',
        description: 'Users getting 403 on profile update.',
        owner: 'John Smith',
        status: 'overrun',
        expectedTime: 60,
        actualTime: 90
    },
];

const INITIAL_BLOCKS: CalendarBlock[] = [
    {
        id: 'b1',
        taskId: '1',
        startTime: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
        endTime: new Date(new Date().setHours(10, 30, 0, 0)).toISOString(),
    },
    {
        id: 'b2',
        taskId: '2',
        startTime: new Date(new Date().setHours(13, 0, 0, 0)).toISOString(),
        endTime: new Date(new Date().setHours(15, 0, 0, 0)).toISOString(),
    },
    {
        id: 'b4',
        taskId: '4',
        startTime: new Date(new Date().setHours(15, 0, 0, 0)).toISOString(),
        endTime: new Date(new Date().setHours(16, 30, 0, 0)).toISOString(),
    },
];

export default function WorkspacePage() {
    const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
    const [calendarBlocks, setCalendarBlocks] = useState<CalendarBlock[]>(INITIAL_BLOCKS);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

    const draggingTask = tasks.find(t => t.id === draggingTaskId) || null;

    const handleTaskUpdate = (updatedTask: Task) => {
        setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
        if (selectedTask?.id === updatedTask.id) setSelectedTask(updatedTask);
    };

    const handleDeleteTask = (taskId: string) => {
        setTasks(tasks.filter(t => t.id !== taskId));
        setCalendarBlocks(calendarBlocks.filter(b => b.taskId !== taskId));
        if (selectedTask?.id === taskId) setSelectedTask(null);
    };

    const handleAddTask = () => {
        const newTask: Task = {
            id: Math.random().toString(36).substr(2, 9),
            title: '',
            description: '',
            owner: 'John Smith',
            status: 'planned',
            expectedTime: 0,
            actualTime: 0,
        };
        setTasks([...tasks, newTask]);
        setSelectedTask(newTask);
    };

    return (
        <>
            <WorkspaceView
                tasks={tasks}
                calendarBlocks={calendarBlocks}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onTaskClick={setSelectedTask}
                onUpdateTask={handleTaskUpdate}
                onAddTask={handleAddTask}
                onDeleteTask={handleDeleteTask}
                draggingTask={draggingTask}
                onDragStart={setDraggingTaskId}
            />

            {selectedTask && (
                <TaskModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={handleTaskUpdate}
                />
            )}
        </>
    );
}
