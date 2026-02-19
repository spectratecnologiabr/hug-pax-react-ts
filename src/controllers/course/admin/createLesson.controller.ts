import axios from "axios";
import { getCookies } from "../../misc/cookies.controller";

export interface ILessonData {
    moduleId: number;
    title: string;
    subTitle?: string;
    slug: string;
    type: "video" | "pdf" | "attachment";
    extUrl?: string;
    code?: string;
    cover?: string;
    isActive?: number;
    allowDownload?: boolean;
}

export async function createLesson(data: ILessonData) {
    const payload = {
        moduleId: data.moduleId,
        title: data.title,
        subTitle: data.subTitle,
        slug: data.slug,
        type: data.type,
        extUrl: data.extUrl,
        code: data.code,
        cover: data.cover,
        isActive: data.isActive ?? true,
        allowDownload: data.allowDownload ?? true,
    };
    const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/lessons`,
        payload,
        {
            headers: {
                Authorization: `Bearer ${getCookies("authToken")}`,
            },
        }
    );
    return response;
}
