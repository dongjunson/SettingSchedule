import axios from 'axios';

// API 기본 URL 설정 (환경변수 또는 기본값)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 사업소 타임라인 데이터 가져오기
export const fetchSiteTimelineData = async (siteId) => {
  try {
    const response = await api.get(`/sites/${siteId}/timeline`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch timeline data:', error);
    throw error;
  }
};

// 모든 사업소 데이터 가져오기
export const fetchAllSitesData = async () => {
  try {
    const response = await api.get('/sites');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch sites data:', error);
    throw error;
  }
};

// 타임라인 항목 업데이트 (서버에 저장)
export const updateTimelineItemOnServer = async (siteId, itemId, updates) => {
  try {
    const response = await api.patch(`/sites/${siteId}/timeline/${itemId}`, updates);
    return response.data;
  } catch (error) {
    console.error('Failed to update timeline item on server:', error);
    throw error;
  }
};

// 체크리스트 항목 업데이트 (서버에 저장)
export const updateChecklistItemOnServer = async (siteId, itemId, checked) => {
  try {
    const response = await api.patch(`/sites/${siteId}/checklist/${itemId}`, { checked });
    return response.data;
  } catch (error) {
    console.error('Failed to update checklist item on server:', error);
    throw error;
  }
};

export default api;
