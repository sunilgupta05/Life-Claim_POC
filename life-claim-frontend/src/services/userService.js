// userService.js

import wrapper from '../util/ApiWrapper';
import adminService from './adminService';

const userService = {
  getUsers: async () => {
    const response = await wrapper.fetchWithToken(`/user/user`);
    const data = await response.json();
    return data;
  },

  getUserById: async (username) => {
    const response = await wrapper.fetchWithToken(`/user/user/${username}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    });

    const data = await response.json();
    return data;
  },

  addUser: async (userData) => { // Changed from createUser to addUser
    const response = await wrapper.fetchWithToken(`/user/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    return data;
  },

  updateUser: async (userId, userData) => {
    console.log("userservice" + userData.active);
    const response = await wrapper.fetchWithToken(`/user/user/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    return data;
  },

  deleteUser: async (userId) => {
    const response = await wrapper.fetchWithToken(`/user/user/${userId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    return data;
  },
};

export default userService

export const getUsers = () => userService.getUsers()
export const createUser = (data) => userService.addUser(data)
export const updateUser = (id, data) => userService.updateUser(id, data)
export const deleteUser = (id) => userService.deleteUser(id)

export const getAuditLogs = async (options = {}) => {
  const logs = await adminService.getAuditEvents(options)
  return { logs: Array.isArray(logs) ? logs : [] }
}