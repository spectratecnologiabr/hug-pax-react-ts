import axios from "axios";
import { getCookies } from "../misc/cookies.controller";
import { listCourses } from "../course/listCourses.controller";
import { getLession } from "../course/getLesson.controller";

export type HelpdeskTicketCategory =
  | "erro-em-aula"
  | "suporte-tecnico"
  | "suporte-pedagogico"
  | "duvida-administrativa";

export type HelpdeskTicketStatus =
  | "aberto"
  | "em-atendimento"
  | "aguardando-usuario"
  | "resolvido";

export type HelpdeskTicketPriority = "alta" | "normal";
export type HelpdeskMessageSender = "user" | "agent" | "system";

export type HelpdeskSessionLog = {
  id?: string | number;
  createdAt?: string;
  route: string;
  viewport: string;
  language?: string;
  timezone?: string;
  userAgent?: string;
};

export type HelpdeskTicketMessage = {
  id: string | number;
  sender: HelpdeskMessageSender;
  content: string;
  createdAt: string;
};

export type HelpdeskTicket = {
  id: string | number;
  userId: string | number;
  userName: string;
  userSchool?: string;
  title: string;
  category: HelpdeskTicketCategory;
  status: HelpdeskTicketStatus;
  priority: HelpdeskTicketPriority;
  createdAt: string;
  updatedAt: string;
  messages: HelpdeskTicketMessage[];
  sessionLogs: HelpdeskSessionLog[];
};

type TicketCreateInput = {
  title: string;
  category: HelpdeskTicketCategory;
  description: string;
};

type HelpdeskLessonContext = {
  source: "current-page" | "history";
  route: string;
  courseId?: number;
  courseSlug?: string;
  courseTitle?: string;
  lessonId?: number;
  lessonTitle?: string;
};

function authHeader() {
  return { Authorization: `Bearer ${getCookies("authToken")}` };
}

function normalizeTicket(raw: any): HelpdeskTicket {
  return {
    id: raw?.id,
    userId: raw?.userId ?? raw?.user_id,
    userName: String(raw?.userName ?? raw?.user_name ?? "Usuário"),
    userSchool: raw?.userSchool ?? raw?.user_school ?? undefined,
    title: String(raw?.title ?? ""),
    category: raw?.category as HelpdeskTicketCategory,
    status: raw?.status as HelpdeskTicketStatus,
    priority: raw?.priority as HelpdeskTicketPriority,
    createdAt: String(raw?.createdAt ?? raw?.created_at ?? new Date().toISOString()),
    updatedAt: String(raw?.updatedAt ?? raw?.updated_at ?? new Date().toISOString()),
    messages: Array.isArray(raw?.messages)
      ? raw.messages.map((message: any) => ({
          id: message?.id,
          sender: message?.sender as HelpdeskMessageSender,
          content: String(message?.content ?? ""),
          createdAt: String(message?.createdAt ?? message?.created_at ?? new Date().toISOString()),
        }))
      : [],
    sessionLogs: Array.isArray(raw?.sessionLogs)
      ? raw.sessionLogs.map((log: any) => ({
          id: log?.id,
          createdAt: log?.createdAt ?? log?.created_at,
          route: String(log?.route ?? "/"),
          viewport: String(log?.viewport ?? "0x0"),
          language: log?.language ?? undefined,
          timezone: log?.timezone ?? undefined,
          userAgent: log?.userAgent ?? log?.user_agent ?? undefined,
        }))
      : [],
  };
}

export function buildSessionLog(): HelpdeskSessionLog {
  return {
    route: window.location.pathname,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    language: navigator.language || "pt-BR",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    userAgent: navigator.userAgent,
  };
}

async function resolveCourseTitleBySlug(courseSlug?: string): Promise<{ id?: number; title?: string } | null> {
  if (!courseSlug) return null;
  try {
    const courses = await listCourses();
    const found = Array.isArray(courses)
      ? courses.find((course: any) => String(course?.slug || "") === String(courseSlug))
      : null;
    if (!found) return null;
    return {
      id: Number(found.id) || undefined,
      title: String(found.title || "").trim() || undefined,
    };
  } catch {
    return null;
  }
}

async function resolveLessonTitle(lessonId?: number): Promise<string | undefined> {
  if (!lessonId || !Number.isFinite(lessonId)) return undefined;

  const cachedRaw = localStorage.getItem("helpdesk:lastLessonContext");
  if (cachedRaw) {
    try {
      const cached = JSON.parse(cachedRaw);
      if (Number(cached?.lessonId) === Number(lessonId)) {
        const cachedTitle = String(cached?.lessonTitle || "").trim();
        if (cachedTitle) return cachedTitle;
      }
    } catch {
      // ignore cache parse errors
    }
  }

  try {
    const lesson = await getLession(lessonId);
    const title =
      String(lesson?.title || "").trim() ||
      String(lesson?.data?.title || "").trim() ||
      String(lesson?.lesson?.title || "").trim();
    return title || undefined;
  } catch {
    return undefined;
  }
}

function getLastPlaybackFromCookie() {
  const rawUserData = getCookies("userData");
  const courses = Array.isArray(rawUserData?.courses) ? rawUserData.courses : [];
  const withLast = courses
    .map((course: any) => ({
      courseId: Number(course?.courseId) || undefined,
      lessonId: Number(course?.playback?.last?.lessonId) || undefined,
      updatedAt: String(course?.playback?.last?.updatedAt || ""),
    }))
    .filter((item: any) => item.courseId && item.lessonId);

  if (!withLast.length) return null;
  withLast.sort((a: any, b: any) => {
    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return bTime - aTime;
  });
  return withLast[0];
}

async function buildLessonContextForTicket(category: HelpdeskTicketCategory): Promise<HelpdeskLessonContext | null> {
  if (category !== "erro-em-aula") return null;

  const pathname = window.location.pathname;
  const routeMatch = pathname.match(/^\/course\/([^/]+)(?:\/lesson\/(\d+))?/i);

  const cachedRaw = localStorage.getItem("helpdesk:lastLessonContext");
  const cached = cachedRaw ? (() => { try { return JSON.parse(cachedRaw); } catch { return null; } })() : null;

  if (routeMatch) {
    const courseSlug = decodeURIComponent(routeMatch[1] || "");
    const lessonId = routeMatch[2] ? Number(routeMatch[2]) : undefined;
    const cachedLessonTitle =
      cached && Number(cached?.lessonId) === Number(lessonId) ? String(cached?.lessonTitle || "").trim() : "";
    const [courseInfo, lessonTitle] = await Promise.all([
      resolveCourseTitleBySlug(courseSlug),
      cachedLessonTitle ? Promise.resolve(cachedLessonTitle) : resolveLessonTitle(lessonId),
    ]);

    return {
      source: "current-page",
      route: pathname,
      courseId: courseInfo?.id,
      courseSlug,
      courseTitle: courseInfo?.title,
      lessonId,
      lessonTitle,
    };
  }

  if (cached && Number(cached?.lessonId)) {
    return {
      source: "history",
      route: pathname,
      courseId: Number(cached?.courseId) || undefined,
      courseSlug: String(cached?.courseSlug || "") || undefined,
      courseTitle: String(cached?.courseTitle || "") || undefined,
      lessonId: Number(cached?.lessonId) || undefined,
      lessonTitle: String(cached?.lessonTitle || "") || undefined,
    };
  }

  const lastPlayback = getLastPlaybackFromCookie();
  if (!lastPlayback) {
    return {
      source: "history",
      route: pathname,
    };
  }

  const [courses, lessonTitle] = await Promise.all([
    listCourses().catch(() => []),
    resolveLessonTitle(lastPlayback.lessonId),
  ]);
  const course = Array.isArray(courses)
    ? courses.find((item: any) => Number(item?.id) === Number(lastPlayback.courseId))
    : null;

  return {
    source: "history",
    route: pathname,
    courseId: lastPlayback.courseId,
    courseSlug: String(course?.slug || "") || undefined,
    courseTitle: String(course?.title || "") || undefined,
    lessonId: lastPlayback.lessonId,
    lessonTitle,
  };
}

export async function listHelpdeskTickets(params?: { status?: string; search?: string }): Promise<HelpdeskTicket[]> {
  const response = await axios.get(`${process.env.REACT_APP_API_URL}/helpdesk/tickets`, {
    params,
    headers: authHeader(),
  });
  const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
  return rows.map(normalizeTicket);
}

export async function listAllHelpdeskTickets(params?: { status?: string; search?: string }): Promise<HelpdeskTicket[]> {
  return listHelpdeskTickets(params);
}

export async function createHelpdeskTicket(input: TicketCreateInput): Promise<HelpdeskTicket | null> {
  const lessonContext = await buildLessonContextForTicket(input.category);
  const response = await axios.post(
    `${process.env.REACT_APP_API_URL}/helpdesk/tickets`,
    {
      title: input.title.trim(),
      category: input.category,
      description: input.description.trim(),
      sessionLog: buildSessionLog(),
      lessonContext,
    },
    { headers: authHeader() }
  );
  const raw = response?.data?.data;
  return raw ? normalizeTicket(raw) : null;
}

export async function appendHelpdeskMessage(ticketId: string | number, content: string, _sender: HelpdeskMessageSender = "user"): Promise<void> {
  await axios.post(
    `${process.env.REACT_APP_API_URL}/helpdesk/tickets/${ticketId}/messages`,
    {
      content: content.trim(),
      sessionLog: buildSessionLog(),
    },
    { headers: authHeader() }
  );
}

export async function updateHelpdeskTicketStatus(ticketId: string | number, status: HelpdeskTicketStatus): Promise<void> {
  await axios.patch(
    `${process.env.REACT_APP_API_URL}/helpdesk/tickets/${ticketId}/status`,
    { status },
    { headers: authHeader() }
  );
}

export async function getHelpdeskOpenCount(): Promise<number> {
  const tickets = await listHelpdeskTickets();
  return tickets.filter((ticket) => ticket.status !== "resolvido").length;
}
