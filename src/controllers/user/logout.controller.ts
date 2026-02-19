import { removeCookies } from "../misc/cookies.controller"

export function doLogout() {
    removeCookies("authToken")
    removeCookies("userData")
    window.location.pathname = "/"
}