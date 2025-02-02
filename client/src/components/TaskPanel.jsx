import React, { useState } from 'react';
import { X, Plus, Calendar } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = 'https://salesiq-fpbsdxbka5auhab8.westus-01.azurewebsites.net/api';

const TaskPanel = ({ isOpen = true, onToggle }) => {
  const queryClient = useQueryClient();
  const [newTask, setNewTask] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [error, setError] = useState(null);

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', showCompleted],
    queryFn: async () => {
      try {
        const { data } = await axios.get(`${API_URL}/tasks`, {
          params: { completed: showCompleted }
        });
        return data;
      } catch (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }
    }
  });

  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: async (newTask) => {
      if (!newTask.title.trim()) {
        throw new Error('Task title is required');
      }
      const response = await axios.post(`${API_URL}/tasks`, newTask);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      setNewTask('');
      setDueDate('');
      setError(null);
    },
    onError: (error) => {
      console.error('Error adding task:', error);
      setError(error.response?.data?.message || 'Failed to add task');
    }
  });

  // Toggle completion mutation
  const toggleCompletionMutation = useMutation({
    mutationFn: async (taskId) => {
      try {
        const response = await axios.patch(`${API_URL}/tasks/${taskId}/complete`);
        return response.data;
      } catch (error) {
        // Check if task not found
        if (error.response?.status === 404) {
          await queryClient.invalidateQueries(['tasks']);
          throw new Error('Task not found');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      setError(null);
    },
    onError: (error) => {
      console.error('Error toggling task:', error);
      setError('Failed to update task status');
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId) => {
      if (!taskId) {
        throw new Error('Task ID is required');
      }
      try {
        const response = await axios.delete(`${API_URL}/tasks/${taskId}`);
        return response.data;
      } catch (error) {
        // If task is already deleted, consider it a success
        if (error.response?.status === 404) {
          return { message: 'Task already deleted' };
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      setError(null);
    },
    onError: (error) => {
      console.error('Error deleting task:', error);
      setError('Failed to delete task');
      // Refresh task list to ensure UI is in sync
      queryClient.invalidateQueries(['tasks']);
    }
  });

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    addTaskMutation.mutate({
      title: newTask.trim(),
      dueDate: dueDate || null,
      completed: false
    });
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTaskMutation.mutateAsync(taskId);
    } catch (error) {
      console.error('Failed to delete task:', error);
      // Error handling is in mutation config
    }
  };

  const handleToggleCompletion = async (taskId) => {
    try {
      await toggleCompletionMutation.mutateAsync(taskId);
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
      // Error handling is in mutation config
    }
  };

  return (
    <div className={`side-panel side-panel-right ${isOpen ? 'open' : ''}`}>
      <div className="panel-header bg-white border-b">
        <h2 className="text-lg font-semibold">Tasks</h2>
        {onToggle && (
          <button 
            onClick={onToggle}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Hide Tasks Panel"
          >
            <X size={20} className="text-gray-500" />
          </button>
        )}
      </div>

      <div className="panel-content">
        {error && (
          <div className="mb-4 p-2 text-sm text-red-600 bg-red-50 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleAddTask} className="add-task-form">
          <input
            type="text"
            placeholder="Add a new task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="add-task-input"
          />
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="add-task-input"
              min={new Date().toISOString().split('T')[0]}
            />
            <button
              type="submit"
              className="btn-primary flex items-center"
              disabled={!newTask.trim() || addTaskMutation.isLoading}
            >
              {addTaskMutation.isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <Plus size={20} className="mr-1" />
                  Add
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-700">
            {showCompleted ? 'All Tasks' : 'Active Tasks'}
          </h3>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showCompleted ? 'Hide Completed' : 'Show Completed'}
          </button>
        </div>

        <div className="space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="panel-empty-state">
              <p className="text-gray-500">No tasks yet</p>
            </div>
          ) : (
            tasks.map(task => (
              <div key={task._id} className="task-item">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggleCompletion(task._id)}
                  className="task-checkbox"
                  disabled={toggleCompletionMutation.isLoading}
                />
                <div className="task-content">
                  <p className={`task-title ${task.completed ? 'line-through text-gray-400' : ''}`}>
                    {task.title}
                  </p>
                  {task.dueDate && (
                    <div className="task-due-date flex items-center">
                      <Calendar size={12} className="mr-1" />
                      {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteTask(task._id)}
                  className="text-gray-400 hover:text-red-500"
                  disabled={deleteTaskMutation.isLoading}
                >
                  <X size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskPanel;