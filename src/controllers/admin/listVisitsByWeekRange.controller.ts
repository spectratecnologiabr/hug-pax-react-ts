import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

/**
 * Recebe uma data (YYYY-MM-DD) e busca os agendamentos
 * do primeiro ao último dia da semana correspondente (segunda a domingo)
 */
export async function listVisitsByWeekRange(selectedDate: string, consultantId?: number) {
    const baseDate = new Date(`${selectedDate}T12:00:00`);

    const dayOfWeek = baseDate.getDay(); // 0 (dom) - 6 (sab)
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const weekStart = new Date(baseDate);
    weekStart.setDate(baseDate.getDate() + diffToMonday);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const startDate = weekStart.toISOString().split("T")[0];
    const endDate = weekEnd.toISOString().split("T")[0];

    const response = await axios.get(`${process.env.REACT_APP_API_URL}/visits/admin/by-week`, {
        params: {
            startDate,
            endDate,
            consultantId
        },
        headers: {
            Authorization: `Bearer ${getCookies('authToken')}`
        }
    });

    return response.data;
}