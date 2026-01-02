import React, { useEffect, useState } from "react";
import AsideMenu from "../components/asideMenu";
import EducatorsRoom from "../components/dash/educatorsRoom";

import { listCourses } from "../controllers/course/listCourses.controller";

import "../style/educatorsPage.css";

type TCourse = {
    id: number,
    slug: string,
    title: string,
    cover: string,
    subTitle: string,
    createdAt: string,
    updatedAt: string,
    progressPercentage: number
}

function EducatorsPage() {
    const [courses, setCourses] = useState<TCourse[]>([]);

        useEffect(() => {    
            async function fetchCourses() {
                try {
                    const coursesList = await listCourses();
                    setCourses(coursesList);
                } catch (error) {
                    console.error("Error fetching courses:", error);
                }
            }
    
            fetchCourses();
        }, []);

    return (
        <React.Fragment>
            <div className="educators-page-container">
                <AsideMenu />
                <div className="educators-page-wrapper">
                    <EducatorsRoom courses={courses} />
                </div>
            </div>
        </React.Fragment>
    )
}

export default EducatorsPage