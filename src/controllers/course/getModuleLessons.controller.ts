import axios from "axios";

export async function getModuleLessons(moduleId: number) {
    const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/lessons/module/${moduleId}`
    );

    return response.data
}