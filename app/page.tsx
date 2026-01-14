'use client';

import { useState } from 'react';
import Sidebar, { ViewMode } from '@/components/sidebar';
import WorkspaceView from '@/components/workspace-view';
import TaskModal from '@/components/task-modal';
import { Database } from '@/lib/database.types';
import { format } from 'date-fns';

type TaskStatus = Database['public']['Enums']['task_status'];

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  expectedTime: number;
  actualTime: number;
  owner: string;
}

interface CalendarBlock {
  id: string;
  taskId: string;
  startTime: string;
  endTime: string;
}

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

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('workspace');
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

  const ProgressView = () => (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Team Progress</h1>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-medium">
            <tr>
              <th className="px-6 py-4">Employee</th>
              <th className="px-6 py-4">Tasks Today</th>
              <th className="px-6 py-4 text-right">Planned Time</th>
              <th className="px-6 py-4 text-right">Actual Time</th>
              <th className="px-6 py-4 text-center">Velocity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">JS</div>
                <span className="font-medium text-gray-900">John Smith</span>
              </td>
              <td className="px-6 py-4 text-gray-600">4 tasks</td>
              <td className="px-6 py-4 text-right font-mono text-gray-600">5.0h</td>
              <td className="px-6 py-4 text-right font-mono text-gray-600">2.25h</td>
              <td className="px-6 py-4 text-center">
                <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">105%</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const SettingsView = () => (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-gray-500">Settings coming soon...</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen bg-white text-gray-900 overflow-hidden relative">
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        currentView={viewMode}
        setCurrentView={setViewMode}
      />

      <main className="flex-1 h-full overflow-hidden relative z-0">
        {viewMode === 'workspace' && (
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
        )}

        {viewMode === 'progress' && <ProgressView />}
        {viewMode === 'settings' && <SettingsView />}
      </main>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
        />
      )}
    </div>
  );
}
