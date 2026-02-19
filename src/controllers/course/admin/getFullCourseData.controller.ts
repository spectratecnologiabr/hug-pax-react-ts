

import axios from "axios";
import { getCookies } from "../../misc/cookies.controller";

export async function getFullCourseData(courseId: number) {
  const response = await axios.get(
    `${process.env.REACT_APP_API_URL}/courses/full/${courseId}`,
    {
      headers: {
        Authorization: `Bearer ${getCookies("authToken")}`,
      },
    }
  );

  return response.data;
}