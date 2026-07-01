import axios from 'axios';

const VAPI_BASE_URL = 'https://api.vapi.ai';

const getClient = (apiKey: string) => {
  return axios.create({
    baseURL: VAPI_BASE_URL,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });
};

export const createAssistant = async (assistantData: any, apiKey: string) => {
  try {
    const response = await getClient(apiKey).post('/assistant', assistantData);
    return response.data;
  } catch (error: any) {
    console.error('Vapi Create Assistant Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to create assistant in Vapi');
  }
};

export const updateAssistant = async (id: string, assistantData: any, apiKey: string) => {
  try {
    const response = await getClient(apiKey).patch(`/assistant/${id}`, assistantData);
    return response.data;
  } catch (error: any) {
    console.error('Vapi Update Assistant Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to update assistant in Vapi');
  }
};

export const getAssistant = async (id: string, apiKey: string) => {
  try {
    const response = await getClient(apiKey).get(`/assistant/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Vapi Get Assistant Error:', error.response?.data || error.message);
    throw new Error('Failed to get assistant from Vapi');
  }
};

export const getCalls = async (params: any, apiKey: string) => {
  try {
    const response = await getClient(apiKey).get('/call', { params });
    return response.data;
  } catch (error: any) {
    console.error('Vapi Get Calls Error:', error.response?.data || error.message);
    throw new Error('Failed to fetch calls from Vapi');
  }
};
