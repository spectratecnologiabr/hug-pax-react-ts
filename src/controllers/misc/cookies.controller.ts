import Cookies from 'universal-cookie';

export interface ICookieData {
    name: string;
    value: string;
}

export function setCookie(props:ICookieData) {
    const cookies = new Cookies();
    cookies.set(props.name, props.value);
}

export function getCookies(props:string) {
    const cookies = new Cookies();
    return cookies.get(props);
}

export function removeCookies(props:string) {
    const cookies = new Cookies();
    cookies.remove(props);
}