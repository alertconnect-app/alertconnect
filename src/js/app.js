import { Router } from "./router.js";
import { AuthService } from "./auth.js";

import { renderSplash } from "./views/splash.js";
import { renderWelcome } from "./views/welcome.js";
import { renderHome } from "./views/home.js";
import { renderProfile } from "./views/profile.js";
import { renderGroups } from "./views/groups.js";
import { renderGroupDetail } from "./views/group-detail.js";
import { renderCreateGroup } from "./views/create-group.js";
import { renderInviteMember } from "./views/invite-member.js";
import { renderInvitationLanding } from "./views/invitation-landing.js";
import { renderMessages } from "./views/messages.js";
import { renderConversation } from "./views/conversation.js";
import { renderAlerts } from "./views/alerts.js";
import { renderNotifications } from "./views/notifications.js";
import { renderSettings } from "./views/settings.js";
import { renderGuest } from "./views/guest.js";
import { renderAdminDashboard } from "./views/admin-dashboard.js";
import { renderMasterControl } from "./views/master-control.js";
import { renderAccessDenied } from "./views/access-denied.js";
import { renderTransferAdmin } from "./views/transfer-admin.js";
import { renderResignAdmin } from "./views/resign-admin.js";

// Register all application routes
Router.register("splash", renderSplash, false);
Router.register("welcome", renderWelcome, false);
Router.register("invitation-landing", renderInvitationLanding, false);
Router.register("guest", renderGuest, false);

Router.register("home", renderHome, true);
Router.register("profile", renderProfile, true);
Router.register("groups", renderGroups, true);
Router.register("group-detail", renderGroupDetail, true);
Router.register("create-group", renderCreateGroup, true);
Router.register("invite-member", renderInviteMember, true);
Router.register("messages", renderMessages, true);
Router.register("conversation", renderConversation, true);
Router.register("alerts", renderAlerts, true);
Router.register("notifications", renderNotifications, true);
Router.register("settings", renderSettings, true);

Router.register("admin-dashboard", renderAdminDashboard, true, "ORGANIZER");
Router.register("master-control", renderMasterControl, true, "MASTER_ADMIN");
Router.register("transfer-admin", renderTransferAdmin, true, "MASTER_ADMIN");
Router.register("resign-admin", renderResignAdmin, true, "MASTER_ADMIN");

Router.register("access-denied", renderAccessDenied, true);
Router.register("404", renderAccessDenied, true);

// Initialize router and authentication on DOM load
window.addEventListener("DOMContentLoaded", () => {
    if (!window.location.hash) {
        window.location.hash = "#splash";
    }
    Router.init();
});
