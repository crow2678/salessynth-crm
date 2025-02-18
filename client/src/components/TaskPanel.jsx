import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar } from 'lucide-react';
import axios from 'axios';

const API_URL = 'https://salesiq-fpbsdxbka5auhab8.westus-01.azurewebsites.net/api';

const TaskPanel = ({ isOpen = true, onToggle }) => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get auth token
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // Helper function to adjust date for UTC
  const adjustDateForUTC = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1);
    return date;
  };

  // Helper function to format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = adjustDateForUTC(dateString);
    return date.toLocaleDateString();
  };

  // Fetch tasks
  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ completed: showCompleted });
      const response = await fetch(`${API_URL}/tasks?${params}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Handle unauthorized access
          window.location.href = '/login';
          return;
        }
        throw new Error('Failed to fetch tasks');
      }
      
      const data = await response.json();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError('Failed to load tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [showCompleted]);

  const getDueDateColor = (dueDate) => {
    if (!dueDate) return 'text-gray-500';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const taskDate = adjustDateForUTC(dueDate);
    taskDate.setHours(0, 0, 0, 0);
    
    if (taskDate < today) return 'text-red-500';
    if (taskDate > today) return 'text-green-500';
    return 'text-yellow-500'; // Due today
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: newTask.trim(),
          dueDate: dueDate || null,
          completed: false
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }
        throw new Error('Failed to add task');
      }
      
      setNewTask('');
      setDueDate('');
      setError(null);
      await fetchTasks();
    } catch (err) {
      setError('Failed to add task');
      console.error('Error adding task:', err);
    }
  };

const handleToggleCompletion = async (taskId) => {
    if (!taskId) {
      setError('Invalid task ID');
      return;
    }

    try {
      // Optimistically update the UI
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === taskId 
            ? { ...task, completed: !task.completed }
            : task
        )
      );

      // Use axios instead of fetch for better error handling
      const response = await axios.patch(
        `${API_URL}/tasks/${taskId}/toggle`,
        {},
        { headers: getAuthHeaders() }
      );

      // Update the task in state with the response data
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === taskId ? response.data : task
        )
      );
      
      setError(null);
    } catch (err) {
      // Revert optimistic update on error
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === taskId 
            ? { ...task, completed: !task.completed }
            : task
        )
      );

      if (err.response?.status === 401) {
        window.location.href = '/login';
        return;
      }

      console.error('Error toggling task:', err);
      setError(err.response?.data?.message || 'Failed to update task status');
      // Refresh tasks to ensure consistency
      await fetchTasks();
    }
  };

const handleDeleteTask = async (taskId) => {
    if (!taskId) {
      setError('Invalid task ID');
      return;
    }

    try {
      // Optimistically remove the task from UI
      const taskToDelete = tasks.find(task => task._id === taskId);
      setTasks(prevTasks => prevTasks.filter(task => task._id !== taskId));

      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        // Revert optimistic delete if there's an error
        setTasks(prevTasks => [...prevTasks, taskToDelete]);

        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete task');
      }
      
      setError(null);
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err.message || 'Failed to delete task');
      // Refresh tasks to ensure consistency
      await fetchTasks();
    }
  };

  return (
    <div className={`fixed top-0 right-0 h-screen bg-white shadow-lg transition-transform duration-300 ease-in-out transform w-80 
      ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold">Tasks</h2>
        {onToggle && (
          <button 
            onClick={onToggle}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={isOpen ? "Hide Tasks Panel" : "Show Tasks Panel"}
          >
            <X size={20} className="text-gray-500" />
          </button>
        )}
      </div>

      <div className="p-4 h-[calc(100vh-64px)] overflow-y-auto bg-gray-50">
        {error && (
          <div className="mb-4 p-2 text-sm text-red-600 bg-red-50 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleAddTask} className="mb-6 bg-white rounded-lg p-4 shadow-sm">
          <input
            type="text"
            placeholder="Add a new task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="w-full p-2 border rounded-lg mb-2"
          />
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="flex-1 p-2 border rounded-lg"
              min={new Date().toISOString().split('T')[0]}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              disabled={!newTask.trim() || isLoading}
            >
              {isLoading ? (
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
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No tasks yet</p>
            </div>
          ) : (
            tasks.map(task => (
              <div key={task._id} 
                className={`flex items-center space-x-3 p-3 bg-white rounded-lg border
                  ${task.completed ? 'opacity-75' : ''}`}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggleCompletion(task._id)}
                  className="h-5 w-5 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {task.title}
                  </p>
                  {task.dueDate && (
                    <div className={`text-xs flex items-center ${getDueDateColor(task.dueDate)}`}>
                      <Calendar size={12} className="mr-1" />
                      {formatDateForDisplay(task.dueDate)}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteTask(task._id)}
                  className="text-gray-400 hover:text-red-500"
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