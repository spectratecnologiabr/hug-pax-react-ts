import Cookies from 'universal-cookie';

export interface ICookieData {
    name: string;
    value: string;
}

export function setCookie(props:ICookieData) {
    const cookies = new Cookies();
    const options = {
        path: "/",
        sameSite: "lax" as const,
        secure: typeof window !== "undefined" ? window.location.protocol === "https:" : false
    };

    cookies.remove(props.name, { path: "/" });
    cookies.remove(props.name, { path: "/login" });
    cookies.set(props.name, props.value, options);

    if (typeof window !== "undefined") {
        window.localStorage.setItem(props.name, props.value);
    }
}

export function getCookies(props:string) {
    const cookies = new Cookies();
    const cookieValue = cookies.get(props);

    if (cookieValue !== undefined) {
        return cookieValue;
    }

    if (typeof window !== "undefined") {
        return window.localStorage.getItem(props) ?? undefined;
    }

    return undefined;
}

export function removeCookies(props:string) {
    const cookies = new Cookies();
    cookies.remove(props, {
        path: "/"
    });
    cookies.remove(props, {
        path: "/login"
    });

    if (typeof window !== "undefined") {
        window.localStorage.removeItem(props);
    }
}
