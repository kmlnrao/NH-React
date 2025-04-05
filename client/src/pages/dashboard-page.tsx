import { Layout } from "@/components/layout";
import { NotificationSummary } from "@/components/notification-summary";
import { NotificationList } from "@/components/notification-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ComplianceTask } from "@shared/schema";
import { format } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default function DashboardPage() {
  // Fetch tasks for the upcoming tasks section
  const { data: tasks, isLoading: isTasksLoading } = useQuery<ComplianceTask[]>({
    queryKey: ["/api/tasks"],
  });

  // Prepare data for the pie chart
  const taskStats = tasks ? {
    statutory: tasks.filter(task => task.type === 'statutory').length,
    payment: tasks.filter(task => task.type === 'payment').length,
    task: tasks.filter(task => task.type === 'task').length,
    escalation: tasks.filter(task => task.type === 'escalation').length
  } : { statutory: 0, payment: 0, task: 0, escalation: 0 };

  const chartData = [
    { name: 'Statutory', value: taskStats.statutory, color: '#1976d2' },
    { name: 'Payment', value: taskStats.payment, color: '#4caf50' },
    { name: 'Task-Based', value: taskStats.task, color: '#9c27b0' },
    { name: 'Escalation', value: taskStats.escalation, color: '#f44336' }
  ].filter(item => item.value > 0);

  // Filter tasks that are due in the next 7 days
  const upcomingTasks = tasks ? 
    tasks
      .filter(task => {
        const dueDate = new Date(task.dueDate);
        const now = new Date();
        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(now.getDate() + 7);
        return dueDate >= now && dueDate <= sevenDaysLater && task.status === 'pending';
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5) : [];

  return (
    <Layout title="Dashboard">
      <div className="space-y-6">
        {/* Notification Summary Cards */}
        <NotificationSummary />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notification List */}
          <div className="lg:col-span-2">
            <NotificationList />
          </div>

          {/* Task Distribution & Upcoming Tasks */}
          <div className="space-y-6">
            {/* Task Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Task Distribution</CardTitle>
                <CardDescription>Breakdown of tasks by type</CardDescription>
              </CardHeader>
              <CardContent>
                {isTasksLoading ? (
                  <div className="h-[250px] flex items-center justify-center">
                    <Skeleton className="h-[200px] w-[200px] rounded-full" />
                  </div>
                ) : chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} tasks`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-gray-500">
                    No task data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Tasks</CardTitle>
                <CardDescription>Tasks due in the next 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                {isTasksLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : upcomingTasks.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingTasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium text-sm">{task.title}</p>
                          <p className="text-xs text-gray-500">
                            {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
                          </p>
                        </div>
                        <div className="text-sm text-gray-700">
                          {format(new Date(task.dueDate), 'dd MMM yyyy')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[150px] flex items-center justify-center text-gray-500">
                    No upcoming tasks in the next 7 days
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
