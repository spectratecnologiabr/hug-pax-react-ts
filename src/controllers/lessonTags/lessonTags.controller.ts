import axios from 'axios'
import { getCookies } from '../misc/cookies.controller'

const apiUrl = process.env.REACT_APP_API_URL

function authHeaders() {
  return { Authorization: `Bearer ${getCookies('authToken')}` }
}

export async function listTagCategories(includeInactive = true) {
  const response = await axios.get(`${apiUrl}/lesson-tags/categories`, {
    headers: authHeaders(),
    params: { includeInactive }
  })
  return response.data?.data ?? []
}

export async function createTagCategory(payload: any) {
  const response = await axios.post(`${apiUrl}/lesson-tags/categories`, payload, {
    headers: authHeaders()
  })
  return response.data?.data
}

export async function updateTagCategory(id: number, payload: any) {
  const response = await axios.put(`${apiUrl}/lesson-tags/categories/${id}`, payload, {
    headers: authHeaders()
  })
  return response.data?.data
}

export async function listTags(params?: { categoryId?: number; includeInactive?: boolean; q?: string }) {
  const response = await axios.get(`${apiUrl}/lesson-tags`, {
    headers: authHeaders(),
    params
  })
  return response.data?.data ?? []
}

export async function createTag(payload: any) {
  const response = await axios.post(`${apiUrl}/lesson-tags`, payload, {
    headers: authHeaders()
  })
  return response.data?.data
}

export async function updateTag(id: number, payload: any) {
  const response = await axios.put(`${apiUrl}/lesson-tags/${id}`, payload, {
    headers: authHeaders()
  })
  return response.data?.data
}

export async function listTagCloud() {
  const response = await axios.get(`${apiUrl}/lesson-tags/cloud/list`, {
    headers: authHeaders()
  })
  return response.data?.data ?? []
}

export async function listLessonTags(lessonId: number) {
  const response = await axios.get(`${apiUrl}/lesson-tags/lesson/${lessonId}`, {
    headers: authHeaders()
  })
  return response.data?.data ?? []
}

export async function setLessonTags(lessonId: number, tagIds: number[]) {
  const response = await axios.put(`${apiUrl}/lesson-tags/lesson/${lessonId}`, { tagIds }, {
    headers: authHeaders()
  })
  return response.data?.data ?? []
}
