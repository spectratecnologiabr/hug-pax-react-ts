export type CourseCategory = "course" | "teacher_material" | "student_material";

export const COURSE_CATEGORY_OPTIONS: Array<{ value: CourseCategory; label: string; description: string }> = [
  {
    value: "course",
    label: "Curso",
    description: "Conteúdo principal da formação."
  },
  {
    value: "teacher_material",
    label: "Material didático do professor",
    description: "Material de apoio exclusivo para educadores."
  },
  {
    value: "student_material",
    label: "Material didático do aluno",
    description: "Material de apoio exclusivo para alunos."
  }
];

export function getCourseCategoryLabel(category?: string) {
  return COURSE_CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? "Curso";
}

export function getCourseCategoryDescription(category?: string) {
  return COURSE_CATEGORY_OPTIONS.find((option) => option.value === category)?.description ?? COURSE_CATEGORY_OPTIONS[0].description;
}

export function normalizeCourseCategory(category?: string): CourseCategory {
  if (category === "teacher_material" || category === "student_material") {
    return category;
  }

  return "course";
}
