const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

/**
 * Check whether the authenticated caller is an active MASTER_ADMIN.
 */
async function requireMasterAdmin(request) {
    if (!request.auth || !request.auth.uid) {
        throw new HttpsError(
            "unauthenticated",
            "Authentication is required."
        );
    }

    const callerUid = request.auth.uid;

    const callerRef = db.collection("users").doc(callerUid);
    const callerSnap = await callerRef.get();

    if (!callerSnap.exists) {
        throw new HttpsError(
            "permission-denied",
            "User account was not found."
        );
    }

    const callerData = callerSnap.data();

    if (
        callerData.systemRole !== "MASTER_ADMIN" ||
        callerData.status !== "ACTIVE"
    ) {
        throw new HttpsError(
            "permission-denied",
            "Only an active Master Admin can perform this operation."
        );
    }

    return {
        uid: callerUid,
        data: callerData,
        ref: callerRef
    };
}

/**
 * Validate a successor for Master Admin transfer.
 */
async function validateSuccessor(successorUid, currentMasterUid) {
    if (!successorUid || typeof successorUid !== "string") {
        throw new HttpsError(
            "invalid-argument",
            "A valid successor user ID is required."
        );
    }

    if (successorUid === currentMasterUid) {
        throw new HttpsError(
            "invalid-argument",
            "The current Master Admin cannot transfer the role to themselves."
        );
    }

    const successorRef = db.collection("users").doc(successorUid);
    const successorSnap = await successorRef.get();

    if (!successorSnap.exists) {
        throw new HttpsError(
            "not-found",
            "The selected successor does not exist."
        );
    }

    const successorData = successorSnap.data();

    if (successorData.status !== "ACTIVE") {
        throw new HttpsError(
            "failed-precondition",
            "The selected successor is not an active user."
        );
    }

    if (
        successorData.systemRole !== "REGISTERED_USER" &&
        successorData.systemRole !== "ORGANIZER"
    ) {
        throw new HttpsError(
            "failed-precondition",
            "The selected successor is not eligible to become Master Admin."
        );
    }

    return {
        ref: successorRef,
        data: successorData
    };
}

/**
 * Secure Master Admin Transfer
 *
 * Only the current active MASTER_ADMIN can call this function.
 *
 * The transfer is performed inside a Firestore transaction so that
 * the role reassignment and audit record remain consistent.
 */
exports.transferMasterAdmin = onCall(async (request) => {
    const caller = await requireMasterAdmin(request);

    const successorUid = request.data?.successorUid;

    const successor = await validateSuccessor(
        successorUid,
        caller.uid
    );

    const oldMasterRef = caller.ref;
    const newMasterRef = successor.ref;

    const auditRef = db.collection("auditLogs").doc();

    await db.runTransaction(async (transaction) => {
        const oldMasterSnap = await transaction.get(oldMasterRef);
        const newMasterSnap = await transaction.get(newMasterRef);

        if (!oldMasterSnap.exists || !newMasterSnap.exists) {
            throw new HttpsError(
                "not-found",
                "One or more required user accounts no longer exist."
            );
        }

        const oldMasterData = oldMasterSnap.data();
        const newMasterData = newMasterSnap.data();

        /**
         * Re-check critical privileges inside the transaction.
         * This prevents race-condition based role changes.
         */
        if (
            oldMasterData.systemRole !== "MASTER_ADMIN" ||
            oldMasterData.status !== "ACTIVE"
        ) {
            throw new HttpsError(
                "permission-denied",
                "Caller is no longer the active Master Admin."
            );
        }

        if (newMasterData.status !== "ACTIVE") {
            throw new HttpsError(
                "failed-precondition",
                "Successor must be active."
            );
        }

        if (
            newMasterData.systemRole !== "REGISTERED_USER" &&
            newMasterData.systemRole !== "ORGANIZER"
        ) {
            throw new HttpsError(
                "failed-precondition",
                "Successor is not eligible."
            );
        }

        /**
         * Promote successor.
         */
        transaction.update(newMasterRef, {
            systemRole: "MASTER_ADMIN",
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        /**
         * Demote previous Master Admin.
         */
        transaction.update(oldMasterRef, {
            systemRole: "REGISTERED_USER",
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        /**
         * Immutable audit entry.
         */
        transaction.create(auditRef, {
            logId: auditRef.id,
            actorId: caller.uid,
            action: "MASTER_ADMIN_TRANSFER",
            targetEntity: successorUid,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            metadata: {
                previousMasterAdminId: caller.uid,
                newMasterAdminId: successorUid,
                previousRole: "MASTER_ADMIN",
                newRole: "MASTER_ADMIN"
            }
        });
    });

    return {
        success: true,
        message: "Master Admin transferred successfully.",
        previousMasterAdminId: caller.uid,
        newMasterAdminId: successorUid
    };
});

/**
 * Secure Master Admin Resignation
 *
 * Resignation always requires a successor.
 * The current Master Admin cannot resign without transferring
 * the authority to another eligible active user.
 */
exports.resignMasterAdmin = onCall(async (request) => {
    const caller = await requireMasterAdmin(request);

    const successorUid = request.data?.successorUid;

    const successor = await validateSuccessor(
        successorUid,
        caller.uid
    );

    const oldMasterRef = caller.ref;
    const newMasterRef = successor.ref;

    const auditRef = db.collection("auditLogs").doc();

    await db.runTransaction(async (transaction) => {
        const oldMasterSnap = await transaction.get(oldMasterRef);
        const newMasterSnap = await transaction.get(newMasterRef);

        if (!oldMasterSnap.exists || !newMasterSnap.exists) {
            throw new HttpsError(
                "not-found",
                "One or more required user accounts no longer exist."
            );
        }

        const oldMasterData = oldMasterSnap.data();
        const newMasterData = newMasterSnap.data();

        /**
         * Re-check the current Master Admin inside the transaction.
         */
        if (
            oldMasterData.systemRole !== "MASTER_ADMIN" ||
            oldMasterData.status !== "ACTIVE"
        ) {
            throw new HttpsError(
                "permission-denied",
                "Caller is no longer the active Master Admin."
            );
        }

        if (newMasterData.status !== "ACTIVE") {
            throw new HttpsError(
                "failed-precondition",
                "Successor must be active."
            );
        }

        if (
            newMasterData.systemRole !== "REGISTERED_USER" &&
            newMasterData.systemRole !== "ORGANIZER"
        ) {
            throw new HttpsError(
                "failed-precondition",
                "Successor is not eligible."
            );
        }

        /**
         * Promote successor.
         */
        transaction.update(newMasterRef, {
            systemRole: "MASTER_ADMIN",
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        /**
         * Resigning Master Admin becomes a normal registered user.
         */
        transaction.update(oldMasterRef, {
            systemRole: "REGISTERED_USER",
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        /**
         * Immutable resignation audit record.
         */
        transaction.create(auditRef, {
            logId: auditRef.id,
            actorId: caller.uid,
            action: "MASTER_ADMIN_RESIGNATION",
            targetEntity: successorUid,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            metadata: {
                resigningMasterAdminId: caller.uid,
                successorId: successorUid,
                previousRole: "MASTER_ADMIN",
                successorRole: "MASTER_ADMIN"
            }
        });
    });

    return {
        success: true,
        message: "Master Admin resignation completed successfully.",
        resignedMasterAdminId: caller.uid,
        newMasterAdminId: successorUid
    };
});
