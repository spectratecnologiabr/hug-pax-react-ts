import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export interface ISchoolFinalReportResponse {
  generatedAt: string
  period: { from: string | null; to: string | null }
  school: {
    id: number
    name: string
    city: string | null
    state: string | null
    management: string | null
    consultantId: number | null
    consultantName: string | null
  }
  consultancy: {
    totalVisits: number
    completedVisits: number
    scheduledVisits: number
    cancelledVisits: number
    rescheduledVisits: number
    firstVisitDate: string | null
    lastVisitDate: string | null
    consultantsInvolved: number
    completionRate: number
    index: number
  }
  educatorsEngagement: {
    educatorsTotal: number
    educatorsEngaged: number
    educatorsCompletion100: number
    engagementRate: number
    avgProgress: number
  }
  radar: {
    score: {
      engagement: number
      teacherDomain: number
      managementSupport: number
    }
    buckets: {
      engagement: { evolved: number; stable: number; regressed: number }
      teacherDomain: { evolved: number; stable: number; regressed: number }
      managementSupport: { evolved: number; stable: number; regressed: number }
    }
  }
  consolidated: {
    index: number
    note: string
  }
}

export async function getSchoolFinalReport(params: {
  collegeId: number
  from?: string
  to?: string
}) {
  const response = await axios.get(
    `${process.env.REACT_APP_API_URL}/visits/admin/school-final-report/${params.collegeId}`,
    {
      headers: {
        Authorization: `Bearer ${getCookies("authToken")}`
      },
      params: {
        from: params.from,
        to: params.to,
      },
    }
  )

  return (response.data?.data ?? response.data) as ISchoolFinalReportResponse
}
