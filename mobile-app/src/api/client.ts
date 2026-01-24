import axios from 'axios';
import { API_URL } from '../config';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to unwrap data and propagate errors
export async function get<T>(url: string) {
  const res = await api.get<T>(url);
  return res.data;
}

export async function post<T>(url: string, body?: any) {
  const res = await api.post<T>(url, body);
  return res.data;
}