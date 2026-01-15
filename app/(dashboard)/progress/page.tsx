export default function ProgressPage() {
    return (
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
                                <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-xs">JS</div>
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
}
