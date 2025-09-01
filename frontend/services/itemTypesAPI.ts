import apiClient from './api';

export const itemTypesAPI = {
  // Get all item types
  getTypes: async () => {
    console.log('Fetching item types...');
    const response = await apiClient.get('/itemType');
    console.log('Item types response:', response.data);
    return response.data;
  },

  // Get items for a specific type
  getTypeItems: async (typeId: string) => {
    console.log('Fetching items for type:', typeId);
    const response = await apiClient.get(`/itemType/${typeId}/items`);
    console.log('Type items response:', response.data);
    return response.data;
  },

  // Create new item type
  createType: async (typeData: { name: string; description?: string }) => {
    console.log('Creating item type...');
    const response = await apiClient.post('/itemType', typeData);
    return response.data;
  },

  // Update item type
  updateType: async (typeId: string, typeData: { name?: string; description?: string }) => {
    console.log('Updating item type:', typeId);
    const response = await apiClient.put(`/itemType/${typeId}`, typeData);
    return response.data;
  },

  // Delete item type
  deleteType: async (typeId: string) => {
    console.log('Deleting item type:', typeId);
    const response = await apiClient.delete(`/itemType/${typeId}`);
    return response.data;
  },
};