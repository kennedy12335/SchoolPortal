import Constants from 'expo-constants';

// Central API base URL; pulled from app.json extra.apiUrl
export const API_URL = (Constants.expoConfig as any)?.extra?.apiUrl || 'http://192.168.1.149:8000';