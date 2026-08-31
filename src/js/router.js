import { AuthService } from "./auth.js";
import { renderNavigation } from "./components/navigation.js";

export const Router = {
    routes: {},
    currentRoute: null,

    register(path, viewFunction, requiresAuth = true, requiredSystemRole = null) {
        this.routes[path] = { viewFunction, requiresAuth, requiredSystemRole };
    },

    async handleRoute() {
        const hash = window.location.hash.slice(1) || "splash";
        const [path, queryString] = hash.split("?");
        const route = this.routes[path] || this.routes["404"];

        const container = document.getElementById("view-root");
        const navContainer = document.getElementById("navigation-root");

        if (route.requiresAuth && !AuthService.currentUser) {
            window.location.hash = "#welcome";
            return;
        }

        if (route.requiredSystemRole) {
            const userRole = AuthService.userProfile?.systemRole;
            if (userRole !== route.requiredSystemRole && userRole !== "MASTER_ADMIN") {
                window.location.hash = "#access-denied";
                return;
            }
        }

        container.innerHTML = `<div class="flex items-center justify-center h-full"><div class="animate-spin rounded-full h-10 w-10 border-4 border-emerald-600 border-t-transparent"></div></div>`;

        try {
            await route.viewFunction(container, queryString);
            this.currentRoute = path;
            
            if (route.requiresAuth && AuthService.currentUser) {
                renderNavigation(navContainer, path);
            } else {
                navContainer.innerHTML = "";
            }
        } catch (error) {
            console.error("Route Rendering Error:", error);
            container.innerHTML = `<div class="p-6 text-center text-red-600 font-semibold">Error loading view. Please try again.</div>`;
        }
    },

    init() {
        window.addEventListener("hashchange", () => this.handleRoute());
        AuthService.init(() => {
            this.handleRoute();
        });
    }
};
